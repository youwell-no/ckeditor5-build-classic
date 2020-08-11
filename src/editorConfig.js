export const codeBlock = {
	languages: [ {
		language: 'plaintext',
		label: 'Plain text'
	},
		// { language: 'javascript', label: 'JavaScript' },
	]
};

export const fullToolbar = {
	items: [
		'heading',
		'|',
		'bold',
		'italic',
		'underline',
		'strikethrough',
		'subscript',
		'superscript',
		'alignment',
		'blockQuote',
		'code',
		'codeBlock',
		'|',
		'fontSize',
		'fontColor',
		'fontBackgroundColor',
		'|',
		'bulletedList',
		'numberedList',
		'link',
		'internalLink',
		'|',
		'indent',
		'outdent',
		'|',
		'imageUpload',
		'insertTable',
		'mediaEmbed',
		'|',
		'undo',
		'redo'
	]
};

export const limitedToolbar = {
	items: [
		'heading',
		'|',
		'bold',
		'italic',
		'underline', 'strikethrough', 'code', 'subscript', 'superscript',
		'alignment',
		'blockQuote',
		'|',
		'bulletedList',
		'numberedList',
		'link',
		'imageUpload',
		'highlight',
		'insertTable',
		'mediaEmbed',
		'|',
		'undo',
		'redo'
	]
};

export const image = {
	styles: [
		'full',
		'alignLeft',
		'alignCenter',
		'alignRight',
	],
	toolbar: [
		'imageTextAlternative',
		'|',
		'imageStyle:full',
		'imageStyle:alignLeft',
		'imageStyle:alignCenter',
		'imageStyle:alignRight'
	],
};

export const table = {
	contentToolbar: [
		'tableColumn',
		'tableRow',
		'mergeTableCells',
		'tableProperties',
		'tableCellProperties',
	]
};

export const link = {
	decorators: {
		// toggleDownloadable: {
		// 	mode: 'manual',
		// 	label: 'Downloadable',
		// 	attributes: {
		// 		download: 'file'
		// 	}
		// },
		openInNewTab: {
			mode: 'manual',
			label: 'Open in a new tab',
			defaultValue: true, // This option will be selected by default.
			attributes: {
				target: '_blank',
				rel: 'noopener noreferrer'
			}
		}
	}
};

// This value must be kept in sync with the language defined in webpack.config.js.
export const language = 'en';
