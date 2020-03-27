import View from '@ckeditor/ckeditor5-ui/src/view';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';

import { ensureSafeUrl } from '../utils';

import unlinkIcon from '../../../../theme/icons/unlink.svg';
import pencilIcon from '@ckeditor/ckeditor5-core/theme/icons/pencil.svg';
import '../../../../theme/linkactions.css';
import { unlinkCommandName } from '../constants';

export const actionsViewLinkValue = 'internalLinkValue';

export default class LinkActionsView extends View {
	constructor( locale ) {
		super( locale );

		const t = locale.t;

		this.focusTracker = new FocusTracker();
		this.keystrokes = new KeystrokeHandler();
		this.previewButtonView = this._createPreviewButton();
		this.unlinkButtonView = this._createButton( t( 'Unlink' ), unlinkIcon, unlinkCommandName );
		this.editButtonView = this._createButton( t( 'Edit link' ), pencilIcon, 'edit' );
		this.set( actionsViewLinkValue );
		this._focusables = new ViewCollection();
		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate fields backwards using the Shift + Tab keystroke.
				focusPrevious: 'shift + tab',

				// Navigate fields forwards using the Tab key.
				focusNext: 'tab'
			}
		} );

		this.setTemplate( {
			tag: 'div',

			attributes: {
				class: [
					'ck',
					'ck-link-actions'
				],

				// https://github.com/ckeditor/ckeditor5-link/issues/90
				tabindex: '-1'
			},

			children: [
				this.previewButtonView,
				this.editButtonView,
				this.unlinkButtonView
			]
		} );
	}

	render() {
		super.render();

		const childViews = [
			this.previewButtonView,
			this.editButtonView,
			this.unlinkButtonView
		];

		childViews.forEach( v => {
			// Register the view as focusable.
			this._focusables.add( v );

			// Register the view in the focus tracker.
			this.focusTracker.add( v.element );
		} );

		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element );
	}

	/**
	 * Focuses the fist {@link #_focusables} in the actions.
	 */
	focus() {
		this._focusCycler.focusFirst();
	}

	/**
	 * Creates a button view.
	 *
	 * @private
	 * @param {String} label The button label.
	 * @param {String} icon The button icon.
	 * @param {String} [eventName] An event name that the `ButtonView#execute` event will be delegated to.
	 * @returns {module:ui/button/buttonview~ButtonView} The button view instance.
	 */
	_createButton( label, icon, eventName ) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.delegate( 'execute' ).to( this, eventName );

		return button;
	}

	/**
	 * Creates a link href preview button.
	 *
	 * @private
	 * @returns {module:ui/button/buttonview~ButtonView} The button view instance.
	 */
	_createPreviewButton() {
		const button = new ButtonView( this.locale );
		const bind = this.bindTemplate;
		const t = this.t;

		button.set( {
			withText: true,
			tooltip: t( 'Open link in new tab' )
		} );

		button.extendTemplate( {
			attributes: {
				class: [
					'ck',
					'ck-link-actions__preview'
				],
				[ actionsViewLinkValue ]: bind.to( actionsViewLinkValue, href => href && ensureSafeUrl( href ) ),
			}
		} );

		button.bind( 'label' ).to( this, actionsViewLinkValue, href => {
			return href || t( 'This link has no URL' );
		} );

		button.bind( 'isEnabled' ).to( this, actionsViewLinkValue, href => !!href );

		button.template.tag = 'span';
		button.template.eventListeners = {};

		return button;
	}
}
