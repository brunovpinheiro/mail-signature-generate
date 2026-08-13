import { Resend } from "resend";
import { supabase } from "./supabase.js";
import type { SignatureItem, RequestType } from "./types.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Tacla Shopping <no-reply@taclashopping.com.br>";
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Identifica cada tipo de e-mail no audit_logs. */
type EmailKind =
	| "manager_approval"
	| "requester_confirmation"
	| "requester_approved"
	| "requester_rejected"
	| "weekly_digest";

export interface EmailResult {
	/** true = o Resend aceitou o envio. Não garante entrega — bounce é assíncrono. */
	accepted: boolean;
	emailId?: string;
	error?: string;
}

/**
 * Envia pelo Resend, registra o resultado no audit_logs e devolve o status.
 *
 * O SDK do Resend NÃO lança exceção em falha: devolve `{ data, error }`. Sem
 * checar esse retorno, uma recusa (rate limit, destinatário suprimido,
 * validação) passava despercebida e a solicitação ficava aprovada sem que
 * ninguém recebesse nada.
 *
 * `accepted: true` significa apenas que o Resend aceitou a mensagem. Bounces
 * chegam depois, de forma assíncrona — quem registra esses é o webhook em
 * api/webhooks/resend.ts.
 */
async function deliver(
	kind: EmailKind,
	requestId: string | null,
	to: string,
	subject: string,
	html: string,
): Promise<EmailResult> {
	let result: EmailResult;

	try {
		const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });

		result = error
			? { accepted: false, error: `${error.name}: ${error.message}` }
			: { accepted: true, emailId: data?.id };
	} catch (err) {
		// Falha de rede/timeout antes de chegar ao Resend
		result = { accepted: false, error: err instanceof Error ? err.message : String(err) };
	}

	if (!result.accepted) {
		console.error(`[email] Falha ao enviar (${kind}) para ${to}:`, result.error);
	}

	// O log nunca pode derrubar o fluxo da decisão que já foi gravada
	try {
		await supabase.from("audit_logs").insert({
			request_id: requestId,
			event: result.accepted ? "email_sent" : "email_failed",
			actor_email: to,
			metadata: result.accepted
				? { kind, resend_id: result.emailId }
				: { kind, error: result.error },
		});
	} catch (err) {
		console.error("[email] Falha ao registrar audit_log:", err);
	}

	return result;
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleString("pt-BR", {
		timeZone: "America/Sao_Paulo",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const headerHtml = `
  <div style="background:#0b2a5b;padding:24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;font-family:Arial,sans-serif;">Tacla Shopping</h1>
    <p style="color:#BFC7D5;margin:6px 0 0;font-size:13px;font-family:Arial,sans-serif;">Gerador de Assinaturas de E-mail</p>
  </div>`;

const footerHtml = `
  <div style="background:#f8f9fa;padding:16px;text-align:center;border-top:1px solid #e9ecef;">
    <p style="color:#aaa;font-size:11px;margin:0;font-family:Arial,sans-serif;">
      © ${new Date().getFullYear()} Tacla Shopping. Mensagem automática, não responda.
    </p>
  </div>`;

function wrapEmail(body: string): string {
	return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
    ${headerHtml}
    <div style="padding:32px;">
      ${body}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`;
}

function signatureItemsSummary(items: SignatureItem[], type: RequestType): string {
	if (type === "single") {
		const s = items[0];
		return `
      <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0;font-size:14px;color:#444;">
        <p style="margin:0 0 6px;"><strong style="color:#0b2a5b;">Nome:</strong> ${s.name}</p>
        <p style="margin:0 0 6px;"><strong style="color:#0b2a5b;">Cargo:</strong> ${s.jobTitle}</p>
        ${s.email ? `<p style="margin:0 0 6px;"><strong style="color:#0b2a5b;">E-mail:</strong> ${s.email}</p>` : ""}
        ${s.phone ? `<p style="margin:0;"><strong style="color:#0b2a5b;">Telefone:</strong> ${s.phone}</p>` : ""}
      </div>`;
	}
	return `
    <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0;font-size:14px;color:#444;">
      <p style="margin:0 0 8px;"><strong style="color:#0b2a5b;">Quantidade:</strong> ${items.length} assinaturas</p>
      <p style="margin:0;color:#666;font-size:13px;">Nomes: ${items
				.slice(0, 5)
				.map((i) => i.name)
				.join(", ")}${items.length > 5 ? ` e mais ${items.length - 5}…` : ""}</p>
    </div>`;
}

// ─── Manager: link de aprovação ───────────────────────────────────────────────

export async function sendManagerApprovalEmail(opts: { managerEmail: string; requesterName: string; requesterEmail: string; companyName?: string; type: RequestType; signatureItems: SignatureItem[]; token: string; createdAt: string; requestId?: string }): Promise<EmailResult> {
	const approvalUrl = `${APP_URL}/approve/${opts.token}`;
	const typeLabel = opts.type === "single" ? "Individual" : `Em Massa (${opts.signatureItems.length} assinaturas)`;
	const companyLabel = opts.companyName ?? "Tacla Shopping";

	const body = `
    <h2 style="color:#0b2a5b;margin:0 0 12px;font-size:18px;">Solicitação aguardando sua aprovação</h2>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Uma nova solicitação de assinatura de e-mail foi enviada para sua análise.
    </p>
    <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:0 0 16px;font-size:14px;color:#444;">
      <p style="margin:0 0 6px;"><strong style="color:#0b2a5b;">Empreendimento:</strong> ${companyLabel}</p>
      <p style="margin:0 0 6px;"><strong style="color:#0b2a5b;">Solicitante:</strong> ${opts.requesterName} (${opts.requesterEmail})</p>
      <p style="margin:0 0 6px;"><strong style="color:#0b2a5b;">Tipo:</strong> ${typeLabel}</p>
      <p style="margin:0;"><strong style="color:#0b2a5b;">Data:</strong> ${formatDate(opts.createdAt)}</p>
    </div>
    <p style="color:#444;font-size:14px;margin:0 0 4px;"><strong>Dados da assinatura:</strong></p>
    ${signatureItemsSummary(opts.signatureItems, opts.type)}
    <div style="text-align:center;margin:28px 0;">
      <a href="${approvalUrl}"
         style="background:#0b2a5b;color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
        Revisar e Decidir
      </a>
    </div>
    <p style="color:#888;font-size:12px;text-align:center;margin:0;">
      Este link é exclusivo para você e expira em <strong>72 horas</strong>.<br>
      Não repasse este e-mail.
    </p>`;

	return deliver(
		"manager_approval",
		opts.requestId ?? null,
		opts.managerEmail,
		`[${companyLabel}] Solicitação de assinatura aguardando aprovação`,
		wrapEmail(body),
	);
}

// ─── Solicitante: confirmação de envio ────────────────────────────────────────

export async function sendRequesterConfirmationEmail(opts: { requesterName: string; requesterEmail: string; companyName?: string; type: RequestType; count: number; requestId?: string }): Promise<EmailResult> {
	const typeLabel = opts.type === "single" ? "individual" : `em massa (${opts.count} assinaturas)`;
	const companyLabel = opts.companyName ?? "Tacla Shopping";

	const body = `
    <h2 style="color:#0b2a5b;margin:0 0 12px;font-size:18px;">Solicitação enviada com sucesso</h2>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Olá, <strong>${opts.requesterName}</strong>!
    </p>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Sua solicitação de assinatura ${typeLabel} para <strong>${companyLabel}</strong> foi recebida e enviada para análise dos gestores.
    </p>
    <div style="background:#e8f0fb;border-left:4px solid #0b2a5b;border-radius:4px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#0b2a5b;font-size:14px;">
        Você receberá um e-mail neste endereço assim que a decisão for tomada.
      </p>
    </div>
    <p style="color:#888;font-size:13px;margin:0;">
      Caso não receba uma resposta em 72 horas, entre em contato com o seu gestor.
    </p>`;

	return deliver(
		"requester_confirmation",
		opts.requestId ?? null,
		opts.requesterEmail,
		`[${companyLabel}] Solicitação de assinatura enviada para aprovação`,
		wrapEmail(body),
	);
}

// ─── Solicitante: aprovação ────────────────────────────────────────────────────

export async function sendRequesterApprovedEmail(opts: { requesterName: string; requesterEmail: string; requestId: string; decidedBy: string; companyName?: string }): Promise<EmailResult> {
	const downloadUrl = `${APP_URL}/download/${opts.requestId}`;
	const companyLabel = opts.companyName ?? "Tacla Shopping";

	const body = `
    <h2 style="color:#0b2a5b;margin:0 0 12px;font-size:18px;">Sua assinatura foi aprovada!</h2>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Olá, <strong>${opts.requesterName}</strong>!
    </p>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Ótima notícia! Sua solicitação de assinatura de e-mail foi <strong style="color:#16a34a;">aprovada</strong>.
    </p>
    <p style="color:#444;line-height:1.6;margin:0 0 24px;">
      Clique no botão abaixo para acessar e baixar sua assinatura.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${downloadUrl}"
         style="background:#16a34a;color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
        Baixar Assinatura
      </a>
    </div>
    <p style="color:#888;font-size:12px;text-align:center;margin:0;">
      O link acima é exclusivo para a sua solicitação aprovada.
    </p>`;

	return deliver(
		"requester_approved",
		opts.requestId,
		opts.requesterEmail,
		`[${companyLabel}] Sua assinatura foi aprovada ✓`,
		wrapEmail(body),
	);
}

// ─── Gestor: resumo semanal de pendências ─────────────────────────────────

export async function sendWeeklyDigestEmail(opts: { managerEmail: string; companyName: string; pendingCount: number }): Promise<EmailResult> {
	const adminUrl = `${APP_URL}/admin`;
	const companyLabel = opts.companyName;

	const body = `
    <h2 style="color:#0b2a5b;margin:0 0 12px;font-size:18px;">Solicitações aguardando aprovação</h2>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Olá! Há <strong>${opts.pendingCount} solicitação(ões)</strong> de assinatura de e-mail de <strong>${companyLabel}</strong> aguardando sua aprovação no painel.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${adminUrl}"
         style="background:#0b2a5b;color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
        Acessar Painel de Aprovações
      </a>
    </div>
    <p style="color:#888;font-size:12px;text-align:center;margin:0;">
      Este é um resumo automático enviado toda segunda-feira.
    </p>`;

	// Resumo semanal não pertence a uma solicitação específica
	return deliver(
		"weekly_digest",
		null,
		opts.managerEmail,
		`[${companyLabel}] ${opts.pendingCount} solicitação(ões) aguardando aprovação`,
		wrapEmail(body),
	);
}

// ─── Solicitante: reprovação ──────────────────────────────────────────────────

export async function sendRequesterRejectedEmail(opts: { requesterName: string; requesterEmail: string; reason: string; companyName?: string; requestId?: string }): Promise<EmailResult> {
	const companyLabelRej = opts.companyName ?? "Tacla Shopping";

	const body = `
    <h2 style="color:#0b2a5b;margin:0 0 12px;font-size:18px;">Solicitação reprovada</h2>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Olá, <strong>${opts.requesterName}</strong>.
    </p>
    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
      Infelizmente sua solicitação de assinatura de e-mail não foi aprovada.
    </p>
    ${opts.reason ? `<div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:13px;color:#888;">Motivo informado pelo gestor:</p>
      <p style="margin:0;color:#444;font-size:14px;">${opts.reason}</p>
    </div>` : ''}
    <p style="color:#444;line-height:1.6;margin:16px 0;">
      Você pode corrigir os dados e enviar uma nova solicitação.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}"
         style="background:#0b2a5b;color:#ffffff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
        Fazer Nova Solicitação
      </a>
    </div>`;

	return deliver(
		"requester_rejected",
		opts.requestId ?? null,
		opts.requesterEmail,
		`[${companyLabelRej}] Solicitação de assinatura reprovada`,
		wrapEmail(body),
	);
}
