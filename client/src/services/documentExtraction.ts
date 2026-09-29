import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const MAX_STUDY_TEXT_LENGTH = 15_000

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
	if (!extension || !['txt', 'pdf', 'docx'].includes(extension)) {
		throw new DocumentExtractionError('Choose a .txt, .pdf, or .docx file.')
	}
	if (file.size === 0) throw new DocumentExtractionError('This file is empty. Choose another file.')
	if (file.size > MAX_DOCUMENT_BYTES) throw new DocumentExtractionError('This file is larger than 10 MB. Choose a smaller document.')
	return extension
}

function validateExtractedText(text: string) {
	const cleanText = text.split('\u0000').join('').trim()
	if (!cleanText) {
		throw new DocumentExtractionError('No readable text was found. This may be a scanned PDF; OCR is not available in this app.')
	}
	if (cleanText.length > MAX_STUDY_TEXT_LENGTH) {
		throw new DocumentExtractionError(`This document contains ${cleanText.length.toLocaleString()} characters. The study limit is ${MAX_STUDY_TEXT_LENGTH.toLocaleString()}; select or paste a shorter section.`)
	}
	return cleanText
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
	try {
		const pdf = await loadingTask.promise
		for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
			const page = await pdf.getPage(pageNumber)
			const content = await page.getTextContent()
			pageText.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
			onProgress({ stage: `Extracting PDF text (${pageNumber} of ${pdf.numPages})…`, percent: Math.min(90, 25 + Math.round((pageNumber / pdf.numPages) * 65)) })
		}
	} finally {
		await loadingTask.destroy()
	}
	const text = validateExtractedText(pageText.join('\n\n'))
	onProgress({ stage: 'Document ready', percent: 100 })
	return text
}