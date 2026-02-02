async function exportAsJpeg(
  element: HTMLElement,
  options: { width: number; quality: number }
): Promise<string> {
  const { toJpeg } = await import('html-to-image')
  const jpegOptions = {
    quality: options.quality,
    pixelRatio: 1,
    backgroundColor: '#ffffff',
    canvasWidth: options.width,
    canvasHeight: element.scrollHeight,
  }
  // First call primes html-to-image internal cache (fonts, computed styles).
  // Without this, the first render often returns a blank image.
  await toJpeg(element, jpegOptions)
  return toJpeg(element, jpegOptions)
}

async function exportAsPng(
  element: HTMLElement,
  options: { width: number }
): Promise<string> {
  const { toPng } = await import('html-to-image')
  const pngOptions = {
    pixelRatio: 1,
    backgroundColor: '#ffffff',
    canvasWidth: options.width,
    canvasHeight: element.scrollHeight,
  }
  // First call primes html-to-image internal cache (fonts, computed styles).
  // Without this, the first render often returns a blank image.
  await toPng(element, pngOptions)
  return toPng(element, pngOptions)
}

/**
 * Renders an HTML string to an image data URL by creating a temporary
 * in-viewport container. The container is placed at (0,0) with a very
 * low z-index so it is never visible to the user but still renders
 * correctly (unlike off-screen / opacity:0 approaches that produce
 * blank images in some browsers).
 */
export async function renderHtmlToImage(
  html: string,
  options: { width: number; format: 'png' | 'jpg'; quality?: number }
): Promise<string> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.width = `${options.width}px`
  container.style.overflow = 'hidden'
  container.style.backgroundColor = '#ffffff'
  container.style.zIndex = '-9999'
  container.innerHTML = html
  document.body.appendChild(container)

  // Allow browser to layout the element
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  let dataUrl: string
  try {
    if (options.format === 'jpg') {
      dataUrl = await exportAsJpeg(container, {
        width: options.width,
        quality: options.quality ?? 0.92,
      })
    } else {
      dataUrl = await exportAsPng(container, { width: options.width })
    }
  } finally {
    document.body.removeChild(container)
  }

  return dataUrl
}
