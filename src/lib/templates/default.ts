import type { SignatureData } from "@/types/signature";
import type { TemplateDefinition } from "./index";

function render(data: SignatureData): string {
	const contactRows: string[] = [];

	if (data.email) {
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">📧</td>
        <td style="font-size: 14px">
          <a href="mailto:${data.email}" style="color: #0b2a5b; text-decoration: none">${data.email}</a>
        </td>
      </tr>`
		);
	}

	if (data.website) {
		const displayUrl = data.website.replace(/^https?:\/\//, "");
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">🌐</td>
        <td style="font-size: 14px">
          <a href="${data.website}" style="color: #0b2a5b; text-decoration: none">${displayUrl}</a>
        </td>
      </tr>`
		);
	}

	if (data.phone) {
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">📱</td>
        <td style="font-size: 14px">${data.phone}</td>
      </tr>`
		);
	}

	const contactHtml = contactRows.length > 0 ? `<table cellpadding="0" cellspacing="0" border="0">${contactRows.join("")}</table>` : "";

	const logoHtml = `<td style="padding-left: 0; vertical-align: middle">
        <img src="/mail-logo.png" alt="Logo" style="max-width: 280px; height: auto" />
      </td>`;

	return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #0b2a5b">
  <tr>
    <td style="padding: 16px 24px 16px 0; vertical-align: middle" width="260">
      <div style="font-size: 22px; font-weight: 700; margin-bottom: 0px; line-height: 1.2;">${data.name}</div>
      <div style="font-size: 14px; color: #9aa6b2; margin-bottom: 12px; line-height: 1.2;">${data.jobTitle}</div>
      ${contactHtml}
    </td>
    ${logoHtml}
  </tr>
</table>`;
}

export const defaultTemplate: TemplateDefinition = {
	id: "default",
	name: "Padrão",
	description: "Layout horizontal com informações de contato e logo",
	defaultWidth: 600,
	render,
};
