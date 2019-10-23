import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import linkIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import {
	toWidget,
	viewToModelPositionOutsideModelElement
} from '@ckeditor/ckeditor5-widget/src/utils';

import './internalLink.css';


// To use this plugin the client needs to define an AdapterPlugin that provides a select-mechanism for internal objects.
// Put this AdapterPlugin in the 'extraPlugins'-array on the editor
// It should follow the following pattern:
// 
// function CKEditorInternalLinkAdapterPlugin( editor ) {
// 	const linkPlugin = editor.plugins.get( 'InternalLink' );
// 	linkPlugin.linkObjectSelector = {
// 		select: selectedCallback => {
// 			// TODO: Select your object
//			// Object form: { name: 'some name', id: 'some id' }
// 			selectedCallback( mySelectedObject );
// 		}
// 	};
// }


export default class InternalLink extends Plugin {
	static get pluginName() {
		return 'InternalLink';
	}

	// static get requires() {
	// 	return [Widget];
	// }

	init() {
		const editor = this.editor;
		const t = editor.t;

		this._defineSchema();
		this._defineConverters();

		editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'internalLink' ) )
		);

		editor.ui.componentFactory.add( 'internalLink', locale => {
			const view = new ButtonView( locale );

			if ( !this.linkObjectSelector ) {
				// eslint-disable-next-line no-undef
				console.warn( 'No linkObjectSelector defined for InternalLink. You need to provide a LinkAdapter' );
			}

			else if ( !this.linkObjectSelector.select ) {
				// eslint-disable-next-line no-undef
				console.warn( 'No select function defined in linkObjectSelector. Your LinkAdapter needs a select function' );
				return;
			}

			else {
				view.set( {
					label: t( 'Add internal link' ),
					icon: linkIcon,
					tooltip: true,
				} );

				// Callback executed once the image is clicked.
				view.on( 'execute', () => {
					this.linkObjectSelector.select(
						linkObject => {
							editor.model.change( writer => {
								const imageElement = writer.createElement( 'internalLink', linkObject );

								// Insert the image in the current selection location.
								editor.model.insertContent( imageElement, editor.model.document.selection );
							} );
						}
					);
				} );
			}

			return view;
		} );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'internalLink', {
			// Allow wherever text is allowed:
			allowWhere: '$text',

			// The internalLink will act as an inline node:
			isInline: true,

			// The inline widget is self-contained so it cannot be split by the caret and it can be selected:
			isObject: true,

			// The internalLink can have the following attributes:
			allowAttributes: [ 'id', 'name' ]
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'span',
				classes: [ 'internalLink' ]
			},
			model: ( viewElement, modelWriter ) => {
				const name = viewElement.getChild( 0 ).data;

				return modelWriter.createElement( 'internalLink', {
					name
				} );
			}
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'internalLink',
			view: ( modelItem, viewWriter ) => {
				const widgetElement = createInternalLinkView( modelItem, viewWriter );

				// Enable widget handling on a internalLink element inside the editing view.
				return toWidget( widgetElement, viewWriter );
			}
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'internalLink',
			view: createInternalLinkView
		} );

		// Helper method for both downcast converters.
		function createInternalLinkView( modelItem, viewWriter ) {
			const name = modelItem.getAttribute( 'name' );
			const id = modelItem.getAttribute( 'id' );

			const linkView = viewWriter.createContainerElement( 'span', {
				class: 'internalLink',
				linkTo: id,
			} );

			// Insert the link-name (as a text)
			const innerText = viewWriter.createText( name );
			viewWriter.insert( viewWriter.createPositionAt( linkView, 0 ), innerText );

			return linkView;
		}
	}
}
