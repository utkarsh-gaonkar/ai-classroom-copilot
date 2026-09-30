import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const MAX_STUDY_TEXT_LENGTH = 15_000
const MAX_OCR_PDF_PAGES = 20

export interface ExtractionProgress {
	stage: string
	percent: number
}

export class DocumentExtractionError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'DocumentExtractionError'
	}
}

function validateFile(file: File) {
	const extension = file.name.toLowerCase().split('.').pop()
	if (!extension || !['txt', 'pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(extension)) {
		throw new DocumentExtractionError('Choose a .txt, .pdf, .docx, PNG, JPG, WEBP, or BMP file.')
	}
	if (file.size === 0) throw new DocumentExtractionError('This file is empty. Choose another file.')
	if (file.size > MAX_DOCUMENT_BYTES) throw new DocumentExtractionError('This file is larger than 10 MB. Choose a smaller document.')
	return extension
}

function validateExtractedText(text: string) {
	const cleanText = text.split('\u0000').join('').trim()
	if (!cleanText) {
		throw new DocumentExtractionError('No readable text was found. Try a clearer scan or image with visible text.')
	}
	if (cleanText.length > MAX_STUDY_TEXT_LENGTH) {
		throw new DocumentExtractionError(`This document contains ${cleanText.length.toLocaleString()} characters. The study limit is ${MAX_STUDY_TEXT_LENGTH.toLocaleString()}; select or paste a shorter section.`)
	}
	return cleanText
}

async function recognizeImage(image: Blob | HTMLCanvasElement, onProgress: (progress: ExtractionProgress) => void): Promise<string> {
	const tesseract = await import('tesseract.js')
	const worker = await tesseract.createWorker('eng', undefined, {
		logger: (message) => {
			if (message.status === 'recognizing text') {
				onProgress({ stage: 'Recognizing text with OCR…', percent: Math.min(90, 30 + Math.round(message.progress * 60)) })
			}
		},
	})
	try {
		const result = await worker.recognize(image)
		return result.data.text.trim()
	} finally {
		await worker.terminate()
	}
}

export async function extractDocumentText(
	file: File,
	onProgress: (progress: ExtractionProgress) => void = () => undefined,
): Promise<string> {
	const extension = validateFile(file)
	onProgress({ stage: 'Reading file locally…', percent: 10 })

	if (extension === 'txt') {
		const text = validateExtractedText(await file.text())
		onProgress({ stage: 'Document ready', percent: 100 })
		return text
	}

	if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(extension)) {
		onProgress({ stage: 'Preparing image for OCR…', percent: 20 })
		const text = validateExtractedText(await recognizeImage(file, onProgress))
		onProgress({ stage: 'Document ready', percent: 100 })
		return text
	}

	const buffer = await file.arrayBuffer()
	onProgress({ stage: extension === 'pdf' ? 'Opening PDF…' : 'Extracting Word document…', percent: 25 })

	if (extension === 'docx') {
		const mammoth = (await import('mammoth')).default
		const result = await mammoth.extractRawText({ arrayBuffer: buffer })
		onProgress({ stage: 'Checking extracted text…', percent: 90 })
		const text = validateExtractedText(result.value)
		onProgress({ stage: 'Document ready', percent: 100 })
		return text
	}

	const pdfjs = await import('pdfjs-dist')
	pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
	const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
	const pageText: string[] = []
	let ocrWorker: Awaited<ReturnType<(typeof import('tesseract.js'))['createWorker']>> | undefined
	let ocrPageCount = 0
	try {
		const pdf = await loadingTask.promise
		for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
			const page = await pdf.getPage(pageNumber)
			const content = await page.getTextContent()
			const extractedPageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ').trim()
			if (extractedPageText) {
				pageText.push(extractedPageText)
			} else {
				ocrPageCount += 1
				if (ocrPageCount > MAX_OCR_PDF_PAGES) {
					throw new DocumentExtractionError(`This PDF has more than ${MAX_OCR_PDF_PAGES} scanned pages. Split the document and upload a shorter section.`)
				}
				ocrWorker ??= await (await import('tesseract.js')).createWorker('eng', undefined, {
					logger: (message) => {
						if (message.status === 'recognizing text') {
							onProgress({ stage: `OCR scanned PDF page ${pageNumber} of ${pdf.numPages}…`, percent: Math.min(90, 25 + Math.round(((pageNumber - 1 + message.progress) / pdf.numPages) * 65)) })
						}
					},
				})
				const viewport = page.getViewport({ scale: 1.5 })
				const canvas = document.createElement('canvas')
				canvas.width = Math.ceil(viewport.width)
				canvas.height = Math.ceil(viewport.height)
				const context = canvas.getContext('2d')
				if (!context) throw new DocumentExtractionError('Could not prepare this PDF page for OCR.')
				await page.render({ canvas, canvasContext: context, viewport }).promise
				pageText.push((await ocrWorker.recognize(canvas)).data.text.trim())
				canvas.width = 0
				canvas.height = 0
			}
			onProgress({ stage: `Extracting PDF text (${pageNumber} of ${pdf.numPages})…`, percent: Math.min(90, 25 + Math.round((pageNumber / pdf.numPages) * 65)) })
		}
	} finally {
		if (ocrWorker) await ocrWorker.terminate()
		await loadingTask.destroy()
	}
	const text = validateExtractedText(pageText.join('\n\n'))
	onProgress({ stage: 'Document ready', percent: 100 })
	return text
}