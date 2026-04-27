import type { SignatureData } from "@/types/signature";
import type { TemplateDefinition } from "./index";

function render(data: SignatureData, logoUrl?: string, accentColor?: string): string {
	const color = accentColor ?? "#a17e3e";
	const resolvedLogo = logoUrl ?? "/logos/palladium-curitiba.png";

	const mobileRow = data.mobile
		? `<div style="display: flex; flex-direction: row; gap: 6px; align-items: center; justify-content: flex-start; flex-shrink: 0; position: relative">
        <img style="flex-shrink: 0; width: 16px; height: 16px; position: relative; overflow: visible" src="/gray/smartphone.png" />
        <div style="color: #1f2937; text-align: left; font-family: carbona-variable, sans-serif; font-size: 14px; line-height: 120%; font-weight: 500; position: relative">${data.mobile}</div>
      </div>`
		: "";

	const phoneRow = data.phone
		? `<div style="display: flex; flex-direction: row; gap: 6px; align-items: center; justify-content: flex-start; flex-shrink: 0; position: relative">
        <img style="flex-shrink: 0; width: 16px; height: 16px; position: relative; overflow: visible; aspect-ratio: 1" src="/gray/call.png" />
        <div style="color: #1f2937; text-align: left; font-family: carbona-variable, sans-serif; font-size: 14px; line-height: 120%; font-weight: 500; position: relative">${data.phone}</div>
      </div>`
		: "";

	const emailRow = data.email
		? `<div style="display: flex; flex-direction: row; gap: 6px; align-items: center; justify-content: flex-start; flex-shrink: 0; position: relative">
        <img style="flex-shrink: 0; width: 16px; height: 16px; position: relative; overflow: visible; aspect-ratio: 1" src="/gray/mail.png" />
        <div style="color: #1f2937; text-align: left; font-family: carbona-variable, sans-serif; font-size: 14px; line-height: 120%; font-weight: 500; position: relative">${data.email}</div>
      </div>`
		: "";

	const websiteRow = data.website
		? `<div style="display: flex; flex-direction: row; gap: 6px; align-items: center; justify-content: flex-start; flex-shrink: 0; position: relative">
        <img style="flex-shrink: 0; width: 16px; height: 16px; position: relative; overflow: visible" src="/gray/globe.png" />
        <div style="color: #1f2937; text-align: left; font-family: carbona-variable, sans-serif; font-size: 14px; line-height: 120%; font-weight: 500; position: relative">${data.website.replace(/^https?:\/\//, "")}</div>
      </div>`
		: "";

	const hasContact = data.mobile || data.phone || data.email || data.website;

	const contactSection = hasContact
		? `<div style="padding: 0px 0 20px 0px; display: flex; flex-direction: row; gap: 0px; align-items: flex-start; justify-content: flex-start; align-self: stretch; flex-shrink: 0; position: relative">
      <div style="padding: 0px 32px 0px 0px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; justify-content: flex-start; flex-shrink: 0; position: relative">
        ${mobileRow}
        ${phoneRow}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start; justify-content: flex-start; flex-shrink: 0; position: relative">
        ${emailRow}
        ${websiteRow}
      </div>
    </div>`
		: "";

	return `<div style="-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; background: #ffffff; display: flex; flex-direction: column; gap: 0px; align-items: flex-start; justify-content: flex-start; position: relative; overflow: hidden; max-width: 520px; padding: 0">
  <div style="padding: 0px 0 16px 0px; display: flex; flex-direction: row; gap: 16px; align-items: center; justify-content: flex-start; align-self: stretch; flex-shrink: 0; position: relative">
    <div style="display: flex; flex-direction: column; gap: 0px; align-items: flex-start; justify-content: flex-start; flex: 1; position: relative">
      <div style="color: #1f2937; text-align: left; font-family: carbona-variable, sans-serif; font-size: 20px; line-height: 130%; font-weight: 700; position: relative; align-self: stretch">${data.name}</div>
      <div style="color: ${color}; text-align: left; font-family: carbona-variable, sans-serif; font-size: 14px; font-weight: 500; line-height: 130%; position: relative">${data.jobTitle}</div>
    </div>
  </div>
  ${contactSection}
  <div style="border-style: solid; border-color: ${color}; border-width: 1px 0px 0px 0px; display: flex; flex-direction: row; gap: 0px; align-items: center; justify-content: flex-start; flex-shrink: 0; width: 100%; position: relative; padding: 16px 0">
    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start; justify-content: center; flex: 1; position: relative">
      <img style="width: auto; max-width: 200px; height: 100%; max-height: 80px; position: relative; object-fit: contain" src="${resolvedLogo}" />
    </div>
    <div style="border-width: 0px 0px 0px 1px; border-style: solid; border-image: linear-gradient(180deg, rgba(255, 255, 255, 0) 15%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 85%); border-image-slice: 1; padding: 0px 32px 0px 32px; display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center; align-self: stretch; flex-shrink: 0; position: relative">
      <div style="color: #7f7f7f; text-align: left; font-family: Inter-Regular, sans-serif; font-size: 10px; line-height: 16px; letter-spacing: 0.5px; font-weight: 400; position: relative">Administração</div>
      <div style="flex-shrink: 0; width: 96px; height: 40.42px; position: relative; aspect-ratio: 96/40.42">
        <img style="width: 95.93px; height: 32.34px; position: absolute; right: 0px; top: calc(50% - 12.13px); overflow: visible; aspect-ratio: 95.93/32.34" src="/logo-tacla-small.png" />
      </div>
    </div>
  </div>
</div>`;
}

export const shoppingTemplate: TemplateDefinition = {
	id: "shopping",
	name: "Sub-empresa Tacla",
	description: "Layout com cargo colorido por empreendimento e borda inferior",
	defaultWidth: 520,
	render,
};
