/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 * https://github.com/ckeditor/ckeditor5-link
 */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LinkEditing from './linkediting';
import LinkUI from './linkui';

import './internalLink.css';

function addTranslations( language, translations ) {
	// eslint-disable-next-line no-undef
	if ( !window.CKEDITOR_TRANSLATIONS ) {
		// eslint-disable-next-line no-undef
		window.CKEDITOR_TRANSLATIONS = {};
	}

	// eslint-disable-next-line no-undef
	const dictionary = window.CKEDITOR_TRANSLATIONS[ language ] || ( window.CKEDITOR_TRANSLATIONS[ language ] = {} );

	// Extend the dictionary for the given language.
	Object.assign( dictionary, translations );
}

export default class InternalLink extends Plugin {
	static get requires() {
		return [ LinkEditing, LinkUI ];
	}

	static get pluginName() {
		return 'InternalLink';
	}

	init() {
		addTranslations( 'no', {
			'Link to content': 'Lenke til innhold',
		} );
	}
}

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
