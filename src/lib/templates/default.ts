import type { SignatureData } from "@/types/signature";
import type { TemplateDefinition } from "./index";

function render(data: SignatureData): string {
	const contactRows: string[] = [];

	if (data.email) {
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">
        <img src="/mail.png" alt="Email" style="width: 16px; height: 16px" />
        </td>
        <td style="font-size: 15px">
          <a href="mailto:${data.email}" style="color: #0b2a5b; text-decoration: none">${data.email}</a>
        </td>
      </tr>`
		);
	}

	if (data.website) {
		const displayUrl = data.website.replace(/^https?:\/\//, "");
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">
                <img src="/globe.png" alt="Site" style="width: 16px; height: 16px" />
        </td>
        <td style="font-size: 15px">
          <a href="${data.website}" style="color: #0b2a5b; text-decoration: none">${displayUrl}</a>
        </td>
      </tr>`
		);
	}

	if (data.phone) {
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">
        <img src="/smartphone.png" alt="Telefone" style="width: 16px; height: 16px" />
        </td>
        <td style="font-size: 15px">${data.phone}</td>
      </tr>`
		);
	}

	const contactHtml = contactRows.length > 0 ? `<table cellpadding="0" cellspacing="0" border="0">${contactRows.join("")}</table>` : "";

	const logoHtml = `<td style="padding-left: 0; vertical-align: middle">
        <img src="/mail-logo.png" alt="Logo" style="max-width: 280px; height: auto" />
      </td>`;

	return `<table width="540" cellpadding="0" cellspacing="0" border="0" style="font-family: 'carbona-variable', sans-serif; font-variation-settings: 'MONO' 0, 'slnt' 0, 'wght' 400; color: #0b2a5b">
  <tr>
    <td style="padding: 16px 24px 16px 0; vertical-align: middle" width="260">
      <div style="font-size: 20px; font-variation-settings: 'MONO' 0, 'slnt' 0, 'wght' 600; margin-bottom: 0px; line-height: 1.2;">${data.name}</div>
      <div style="font-size: 13px; color: #BFC7D5; margin-bottom: 12px; line-height: 1.2;">${data.jobTitle}</div>
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
