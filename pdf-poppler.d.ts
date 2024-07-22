declare module 'pdf-poppler' {
	export interface ConvertOptions {
		format:
			| 'png'
			| 'jpeg'
			| 'tiff'
			| 'ppm'
			| 'ps'
			| 'eps'
			| 'svg'
			| 'jpeg2000'
			| 'tiffp'
			| 'tifflzw';
		out_dir: string;
		out_prefix: string;
		page?: number | null;
	}

	export class PdfConverter {
		constructor(pdfFilePath: string);
		convert(options: ConvertOptions): Promise<void>;
	}
}
