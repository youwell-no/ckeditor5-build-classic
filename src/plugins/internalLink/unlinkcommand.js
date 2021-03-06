/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module link/unlinkcommand
 */

import Command from '@ckeditor/ckeditor5-core/src/command';
import findLinkRange from './findlinkrange';
import { modelIdAttribute, linkCommandName } from './constants';

/**
 * The unlink command. It is used by the {@link module:link/link~Link link plugin}.
 *
 * @extends module:core/command~Command
 */
export default class UnlinkCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		this.isEnabled = this.editor.model.document.selection.hasAttribute( modelIdAttribute );
	}

	/**
	 * Executes the command.
	 *
	 * When the selection is collapsed, it removes the `modelIdAttribute` attribute from each node
	 * with the same `modelIdAttribute` attribute value.
	 * When the selection is non-collapsed, it removes the `modelIdAttribute` attribute from each node in selected ranges.
	 *
	 * # Decorators
	 *
	 * If {@link module:link/link~LinkConfig#decorators `config.link.decorators`} is specified,
	 * all configured decorators are removed together with the `modelIdAttribute` attribute.
	 *
	 * @fires execute
	 */
	execute() {
		const editor = this.editor;
		const model = this.editor.model;
		const selection = model.document.selection;
		const linkCommand = editor.commands.get( linkCommandName );

		model.change( writer => {
			// Get ranges to unlink.
			const rangesToUnlink = selection.isCollapsed ?
				[ findLinkRange( selection.getFirstPosition(),
					selection.getAttribute( modelIdAttribute ), model ) ] : selection.getRanges();

			// Remove `modelIdAttribute` attribute from specified ranges.
			for ( const range of rangesToUnlink ) {
				writer.removeAttribute( modelIdAttribute, range );
				// If there are registered custom attributes, then remove them during unlink.
				if ( linkCommand ) {
					for ( const manualDecorator of linkCommand.manualDecorators ) {
						writer.removeAttribute( manualDecorator.id, range );
					}
				}
			}
		} );
	}
}
