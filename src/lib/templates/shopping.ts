import type { SignatureData } from "@/types/signature";
import type { TemplateDefinition } from "./index";

/**
 * Template para as sub-empresas do grupo Tacla Shopping.
 * Usa paleta cinza, ícones em /gray/ e inclui o banner
 * "Tacla Shopping" na linha inferior.
 */
function render(data: SignatureData, logoUrl?: string): string {
	const contactRows: string[] = [];

	if (data.email) {
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">
          <img src="/gray/mail.png" alt="Email" style="width: 16px; height: 16px" />
        </td>
        <td style="font-size: 15px; line-height: 24px">
          <a href="mailto:${data.email}" style="color: #1f2937; text-decoration: none">${data.email}</a>
        </td>
      </tr>`
		);
	}

	if (data.website) {
		const displayUrl = data.website.replace(/^https?:\/\//, "");
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">
          <img src="/gray/globe.png" alt="Site" style="width: 16px; height: 16px" />
        </td>
        <td style="font-size: 15px; line-height: 24px">
          <a href="${data.website}" style="color: #1f2937; text-decoration: none">${displayUrl}</a>
        </td>
      </tr>`
		);
	}

	if (data.phone) {
		contactRows.push(
			`<tr>
        <td style="padding-right: 8px; vertical-align: middle">
          <img src="/gray/smartphone.png" alt="Telefone" style="width: 16px; height: 16px" />
        </td>
        <td style="font-size: 15px; color: #1f2937; line-height: 24px">${data.phone}</td>
      </tr>`
		);
	}

	const contactHtml =
		contactRows.length > 0
			? `<table cellpadding="0" cellspacing="0" border="0"><tbody>${contactRows.join("")}</tbody></table>`
			: "";

	const resolvedLogo = logoUrl ?? "/logos/palladium-curitiba.png";

	return `<table width="540" cellpadding="0" cellspacing="0" border="0" style="font-family: 'carbona-variable', sans-serif; font-variation-settings: 'MONO' 0, 'slnt' 0, 'wght' 400; color: #1f2937">
  <tbody>
    <tr>
      <td style="padding: 16px 24px 16px 0; vertical-align: middle" width="260">
        <div style="font-size: 20px; font-variation-settings: 'MONO' 0, 'slnt' 0, 'wght' 600; margin-bottom: 0px; line-height: 1.2;">${data.name}</div>
        <div style="font-size: 13px; color: #9ca3af; margin-bottom: 12px; line-height: 1.2;">${data.jobTitle}</div>
        ${contactHtml}
      </td>
      <td style="padding-left: 0; vertical-align: middle">
        <img src="${resolvedLogo}" alt="Logo" style="max-width: 280px; height: auto" />
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align: center">
        <img src="/tacla-shopping-bottom.png" alt="Tacla Shopping" style="max-width: 540px; height: auto" />
      </td>
    </tr>
  </tbody>
</table>`;
}

export const shoppingTemplate: TemplateDefinition = {
	id: "shopping",
	name: "Sub-empresa Tacla",
	description: "Layout cinza com banner Tacla Shopping na base",
	defaultWidth: 600,
	render,
};
