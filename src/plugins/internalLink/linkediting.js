/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module link/linkediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TwoStepCaretMovement from '@ckeditor/ckeditor5-typing/src/twostepcaretmovement';

import LinkCommand from './linkcommand';
import UnlinkCommand from './unlinkcommand';
import { createLinkElement, getLocalizedDecorators, normalizeDecorators } from './utils';
import AutomaticDecorators from './utils/automaticdecorators';
import ManualDecorator from './utils/manualdecorator';
import findLinkRange from './findlinkrange';
import '../../../theme/link.css';
import { modelIdAttribute, editorConfigName, linkCommandName, unlinkCommandName, internalLinkCustomProperty,
	htmlClassName, htmlIdAttribute } from './constants';

const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';

export default class LinkEditing extends Plugin {
	static get pluginName() {
		return 'InternalLinkEditing';
	}

	init() {
		const editor = this.editor;

		// Allow link attribute on all inline nodes.
		editor.model.schema.extend( '$text', { allowAttributes: modelIdAttribute } );

		editor.conversion.for( 'upcast' ).elementToAttribute( {
			view: {
				name: 'a',
				attributes: {
					[ htmlIdAttribute ]: true
				},
				classes: [ htmlClassName ]
			},

			model: {
				key: modelIdAttribute,
				value: viewElement => viewElement.getAttribute( htmlIdAttribute )
			}
		}
		);

		editor.conversion.for( 'dataDowncast' )
			.attributeToElement( { model: modelIdAttribute, view: createLinkElement } );

		editor.conversion.for( 'editingDowncast' )
			.attributeToElement( { model: modelIdAttribute, view: createLinkElement } );

		// Create linking commands.
		editor.commands.add( linkCommandName, new LinkCommand( editor ) );
		editor.commands.add( unlinkCommandName, new UnlinkCommand( editor ) );

		const linkDecorators = getLocalizedDecorators( editor.t,
			normalizeDecorators( editor.config.get( `${ editorConfigName }.decorators` ) ) );

		this._enableAutomaticDecorators( linkDecorators.filter( item => item.mode === DECORATOR_AUTOMATIC ) );
		this._enableManualDecorators( linkDecorators.filter( item => item.mode === DECORATOR_MANUAL ) );

		// Enable two-step caret movement for `modelIdAttribute` attribute.
		const twoStepCaretMovementPlugin = editor.plugins.get( TwoStepCaretMovement );
		twoStepCaretMovementPlugin.registerAttribute( modelIdAttribute );

		// Setup highlight over selected link.
		this._setupLinkHighlight();
	}

	/**
	 * Processes an array of configured {@link module:link/link~LinkDecoratorAutomaticDefinition automatic decorators}
	 * and registers a {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher downcast dispatcher}
	 * for each one of them. Downcast dispatchers are obtained using the
	 * {@link module:link/utils~AutomaticDecorators#getDispatcher} method.
	 *
	 * **Note**: This method also activates the automatic external link decorator if enabled with
	 * {@link module:link/link~LinkConfig#addTargetToExternalLinks `config.link.addTargetToExternalLinks`}.
	 *
	 * @private
	 * @param {Array.<module:link/link~LinkDecoratorAutomaticDefinition>} automaticDecoratorDefinitions
	 */
	_enableAutomaticDecorators( automaticDecoratorDefinitions ) {
		const editor = this.editor;
		const automaticDecorators = new AutomaticDecorators();

		// Adds a default decorator for external links.
		// if ( editor.config.get( 'link.addTargetToExternalLinks' ) ) {
		// 	automaticDecorators.add( {
		// 		id: 'linkIsExternal',
		// 		mode: DECORATOR_AUTOMATIC,
		// 		callback: url => EXTERNAL_LINKS_REGEXP.test( url ),
		// 		attributes: {
		// 			target: '_blank',
		// 			rel: 'noopener noreferrer'
		// 		}
		// 	} );
		// }

		automaticDecorators.add( automaticDecoratorDefinitions );

		if ( automaticDecorators.length ) {
			editor.conversion.for( 'downcast' ).add( automaticDecorators.getDispatcher() );
		}
	}

	/**
	 * Processes an array of configured {@link module:link/link~LinkDecoratorManualDefinition manual decorators},
	 * transforms them into {@link module:link/utils~ManualDecorator} instances and stores them in the
	 * {@link module:link/linkcommand~LinkCommand#manualDecorators} collection (a model for manual decorators state).
	 *
	 * Also registers an {@link module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement attribute-to-element}
	 * converter for each manual decorator and extends the {@link module:engine/model/schema~Schema model's schema}
	 * with adequate model attributes.
	 *
	 * @private
	 * @param {Array.<module:link/link~LinkDecoratorManualDefinition>} manualDecoratorDefinitions
	 */
	_enableManualDecorators( manualDecoratorDefinitions ) {
		if ( !manualDecoratorDefinitions.length ) {
			return;
		}

		const editor = this.editor;
		const command = editor.commands.get( linkCommandName );
		const manualDecorators = command.manualDecorators;

		manualDecoratorDefinitions.forEach( decorator => {
			editor.model.schema.extend( '$text', { allowAttributes: decorator.id } );

			// Keeps reference to manual decorator to decode its name to attributes during downcast.
			manualDecorators.add( new ManualDecorator( decorator ) );

			editor.conversion.for( 'downcast' ).attributeToElement( {
				model: decorator.id,
				view: ( manualDecoratorName, writer ) => {
					if ( manualDecoratorName ) {
						const attributes = manualDecorators.get( decorator.id ).attributes;
						const element = writer.createAttributeElement( 'a', attributes, { priority: 5 } );
						writer.setCustomProperty( internalLinkCustomProperty, true, element );

						return element;
					}
				} } );

			editor.conversion.for( 'upcast' ).elementToAttribute( {
				view: {
					name: 'a',
					attributes: manualDecorators.get( decorator.id ).attributes
				},
				model: {
					key: decorator.id
				}
			} );
		} );
	}

	/**
	 * Adds a visual highlight style to a link in which the selection is anchored.
	 * Together with two-step caret movement, they indicate that the user is typing inside the link.
	 *
	 * Highlight is turned on by adding the `.ck-link_selected` class to the link in the view:
	 *
	 * * The class is removed before the conversion has started, as callbacks added with the `'highest'` priority
	 * to {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher} events.
	 * * The class is added in the view post fixer, after other changes in the model tree were converted to the view.
	 *
	 * This way, adding and removing the highlight does not interfere with conversion.
	 *
	 * @private
	 */
	_setupLinkHighlight() {
		const editor = this.editor;
		const view = editor.editing.view;
		const highlightedLinks = new Set();

		// Adding the class.
		view.document.registerPostFixer( writer => {
			const selection = editor.model.document.selection;
			let changed = false;

			if ( selection.hasAttribute( modelIdAttribute ) ) {
				const modelRange = findLinkRange( selection.getFirstPosition(), selection.getAttribute( modelIdAttribute ), editor.model );
				const viewRange = editor.editing.mapper.toViewRange( modelRange );

				// There might be multiple `a` elements in the `viewRange`, for example, when the `a` element is
				// broken by a UIElement.
				for ( const item of viewRange.getItems() ) {
					if ( item.is( 'a' ) && !item.hasClass( HIGHLIGHT_CLASS ) ) {
						writer.addClass( HIGHLIGHT_CLASS, item );
						highlightedLinks.add( item );
						changed = true;
					}
				}
			}

			return changed;
		} );

		// Removing the class.
		editor.conversion.for( 'editingDowncast' ).add( dispatcher => {
			// Make sure the highlight is removed on every possible event, before conversion is started.
			dispatcher.on( 'insert', removeHighlight, { priority: 'highest' } );
			dispatcher.on( 'remove', removeHighlight, { priority: 'highest' } );
			dispatcher.on( 'attribute', removeHighlight, { priority: 'highest' } );
			dispatcher.on( 'selection', removeHighlight, { priority: 'highest' } );

			function removeHighlight() {
				view.change( writer => {
					for ( const item of highlightedLinks.values() ) {
						writer.removeClass( HIGHLIGHT_CLASS, item );
						highlightedLinks.delete( item );
					}
				} );
			}
		} );
	}
}
