/**
 * LoRaWAN Magazin – kleine Frontend-Helfer (kein Framework).
 * 1. Hell/Dunkel-Schalter (merkt sich die Wahl im localStorage)
 * 2. Inhaltsverzeichnis: aktiven Abschnitt hervorheben
 * 3. Lesefortschritt im Artikel
 * 4. Newsletter-Vorschauformular (Staging ohne Mailchimp-Anbindung)
 */
( function () {
	'use strict';

	const root = document.documentElement;
	const store = {
		get( k ) {
			try {
				return localStorage.getItem( k );
			} catch ( e ) {
				return null;
			}
		},
		set( k, v ) {
			try {
				localStorage.setItem( k, v );
			} catch ( e ) {}
		},
	};

	// 1. Farbschema
	const prefersDark = window.matchMedia( '(prefers-color-scheme: dark)' );
	const isDark = () => {
		const t = root.getAttribute( 'data-theme' );
		return t ? t === 'dark' : prefersDark.matches;
	};
	const syncToggles = () => {
		document.querySelectorAll( '[data-lw-theme-toggle]' ).forEach( ( b ) => {
			b.setAttribute( 'aria-pressed', isDark() ? 'true' : 'false' );
		} );
	};
	document.addEventListener( 'click', ( e ) => {
		const btn = e.target.closest( '[data-lw-theme-toggle]' );
		if ( ! btn ) {
			return;
		}
		const next = isDark() ? 'light' : 'dark';
		root.setAttribute( 'data-theme', next );
		store.set( 'lw-theme', next );
		syncToggles();
	} );
	prefersDark.addEventListener( 'change', syncToggles );
	syncToggles();

	// 2. Inhaltsverzeichnis
	const tocLinks = Array.from( document.querySelectorAll( '.lw-toc a[href^="#"]' ) );
	if ( tocLinks.length && 'IntersectionObserver' in window ) {
		const map = new Map();
		tocLinks.forEach( ( a ) => {
			const target = document.getElementById( decodeURIComponent( a.hash.slice( 1 ) ) );
			if ( target ) {
				map.set( target, a );
			}
		} );
		let current = null;
		const io = new IntersectionObserver(
			( entries ) => {
				entries.forEach( ( entry ) => {
					if ( entry.isIntersecting ) {
						if ( current ) {
							current.removeAttribute( 'aria-current' );
						}
						current = map.get( entry.target );
						current.setAttribute( 'aria-current', 'true' );
					}
				} );
			},
			{ rootMargin: '0px 0px -70% 0px' }
		);
		map.forEach( ( _a, target ) => io.observe( target ) );
		// Auf kleinen Bildschirmen startet das Verzeichnis eingeklappt.
		if ( window.matchMedia( '(max-width: 63.99rem)' ).matches ) {
			document.querySelectorAll( '.lw-toc details' ).forEach( ( d ) => d.removeAttribute( 'open' ) );
		}
	}

	// 3. Lesefortschritt
	const article = document.querySelector( '.lw-article-body' );
	if ( article ) {
		const bar = document.createElement( 'div' );
		bar.className = 'lw-progress';
		bar.setAttribute( 'aria-hidden', 'true' );
		document.body.appendChild( bar );
		let ticking = false;
		const update = () => {
			const r = article.getBoundingClientRect();
			const total = r.height - window.innerHeight;
			const p = total > 0 ? Math.min( 1, Math.max( 0, -r.top / total ) ) : 0;
			bar.style.transform = 'scaleX(' + p.toFixed( 4 ) + ')';
			ticking = false;
		};
		window.addEventListener(
			'scroll',
			() => {
				if ( ! ticking ) {
					window.requestAnimationFrame( update );
					ticking = true;
				}
			},
			{ passive: true }
		);
		update();
	}

	// 4. Vorschau-Newsletterformular
	document.querySelectorAll( '[data-lw-demo-form]' ).forEach( ( form ) => {
		form.addEventListener( 'submit', ( e ) => {
			e.preventDefault();
			const status = form.querySelector( '.lw-nl-form__status' );
			if ( status ) {
				status.hidden = false;
				status.textContent =
					'Vorschau: Das Formular ist auf der Staging-Seite nicht mit Mailchimp verbunden. Es wurde nichts gespeichert.';
			}
		} );
	} );
} )();
