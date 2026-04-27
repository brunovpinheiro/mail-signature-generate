import type { SignatureData } from "@/types/signature";
import type { TemplateDefinition } from "./index";

function render(data: SignatureData, logoUrl?: string): string {
	const contactItems: string[] = [];

	if (data.email) {
		contactItems.push(
			`<div style="display: flex; align-items: center; line-height: 24px">
        <img src="/mail.png" alt="Email" style="width: 16px; height: 16px; margin-right: 8px; flex-shrink: 0" />
        <span style="font-size: 15px">
          <a href="mailto:${data.email}" style="color: #0b2a5b; text-decoration: none">${data.email}</a>
        </span>
      </div>`,
		);
	}

	if (data.website) {
		const displayUrl = data.website.replace(/^https?:\/\//, "");
		contactItems.push(
			`<div style="display: flex; align-items: center; line-height: 24px">
        <img src="/globe.png" alt="Site" style="width: 16px; height: 16px; margin-right: 8px; flex-shrink: 0" />
        <span style="font-size: 15px">
          <a href="${data.website}" style="color: #0b2a5b; text-decoration: none">${displayUrl}</a>
        </span>
      </div>`,
		);
	}

	if (data.phone) {
		contactItems.push(
			`<div style="display: flex; align-items: center; line-height: 24px">
        <img src="/smartphone.png" alt="Telefone" style="width: 16px; height: 16px; margin-right: 8px; flex-shrink: 0" />
        <span style="font-size: 15px; color: #0b2a5b">${data.phone}</span>
      </div>`,
		);
	}

	const contactHtml = contactItems.length > 0 ? `<div>${contactItems.join("")}</div>` : "";

	const resolvedLogo = logoUrl ?? "/mail-logo.png";

	return `<div style="display: flex; align-items: center; width: 660px; font-family: 'carbona-variable', sans-serif; font-variation-settings: 'MONO' 0, 'slnt' 0, 'wght' 400; color: #0b2a5b">
  <div style="padding: 16px 24px 16px 0; width: auto; flex-shrink: 0">
    <div style="font-size: 20px; font-variation-settings: 'MONO' 0, 'slnt' 0, 'wght' 600; margin-bottom: 0px; line-height: 1.2;">${data.name}</div>
    <div style="font-size: 13px; color: #BFC7D5; margin-bottom: 12px; line-height: 1.2;">${data.jobTitle}</div>
    ${contactHtml}
  </div>
  <div style="display: flex; align-items: center">
    <img src="${resolvedLogo}" alt="Logo" style="max-width: 280px; height: auto" />
  </div>
</div>`;
}

export const defaultTemplate: TemplateDefinition = {
	id: "default",
	name: "Tacla Shopping",
	description: "Layout azul com informações de contato e logo",
	defaultWidth: 660,
	render,
};
