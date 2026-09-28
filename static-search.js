/*
 * Statische Vorschau: ersetzt die WordPress-Suche durch eine Suche im
 * Browser über search-index.json. Wird nur in den exportierten Dateien
 * eingebunden, nicht im WordPress-Theme.
 */
( function () {
	'use strict';
	var root = window.LW_STATIC_ROOT || './';
	var index = null;

	function load() {
		if ( index ) {
			return Promise.resolve( index );
		}
		return fetch( root + 'search-index.json' )
			.then( function ( r ) {
				return r.json();
			} )
			.then( function ( data ) {
				index = data;
				return data;
			} );
	}

	function esc( s ) {
		return String( s ).replace( /[&<>"]/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ c ];
		} );
	}

	function search( q ) {
		var terms = q.toLowerCase().split( /\s+/ ).filter( Boolean );
		return index
			.map( function ( e ) {
				var t = e.t.toLowerCase();
				var score = 0;
				for ( var i = 0; i < terms.length; i++ ) {
					var term = terms[ i ];
					var inT = t.indexOf( term ) > -1;
					var inX = e.x.indexOf( term ) > -1 || e.d.toLowerCase().indexOf( term ) > -1;
					if ( ! inT && ! inX ) {
						return null;
					}
					score += inT ? 10 : 1;
				}
				return { e: e, s: score };
			} )
			.filter( Boolean )
			.sort( function ( a, b ) {
				return b.s - a.s;
			} )
			.slice( 0, 30 );
	}

	var dialog;
	function show( q ) {
		if ( ! dialog ) {
			dialog = document.createElement( 'div' );
			dialog.className = 'lw-static-search';
			dialog.setAttribute( 'role', 'dialog' );
			dialog.setAttribute( 'aria-modal', 'true' );
			dialog.setAttribute( 'aria-label', 'Suchergebnisse' );
			dialog.innerHTML =
				'<div class="lw-static-search__panel"><div class="lw-static-search__bar"><input type="search" aria-label="Suchbegriff" placeholder="Suchen …"><button type="button" class="lw-static-search__close">Schließen</button></div><p class="lw-static-search__count" role="status"></p><ol class="lw-static-search__list"></ol></div>';
			document.body.appendChild( dialog );
			var style = document.createElement( 'style' );
			style.textContent =
				'.lw-static-search{position:fixed;inset:0;z-index:100;background:rgb(11 22 34/55%);display:grid;place-items:start center;padding:6vh 16px 16px;overflow:auto}' +
				'.lw-static-search__panel{width:min(44rem,100%);background:var(--wp--preset--color--surface);color:var(--wp--preset--color--ink);border-radius:12px;padding:1.25rem;box-shadow:0 20px 60px -20px rgb(0 0 0/50%)}' +
				'.lw-static-search__bar{display:flex;gap:.5rem}.lw-static-search__bar input{flex:1;min-width:0;padding:.7rem 1rem;border:1px solid var(--wp--preset--color--line);border-radius:999px;font:inherit;background:var(--wp--preset--color--paper);color:inherit}' +
				'.lw-static-search__close{border:1px solid var(--wp--preset--color--line);background:none;color:inherit;border-radius:999px;padding:.5rem 1rem;font:inherit;font-size:.875rem;cursor:pointer}' +
				'.lw-static-search__count{font-family:var(--wp--preset--font-family--mono);font-size:.8125rem;color:var(--wp--preset--color--muted);margin:1rem 0 .5rem}' +
				'.lw-static-search__list{list-style:none;margin:0;padding:0;display:grid;gap:.25rem}.lw-static-search__list a{display:block;padding:.7rem .8rem;border-radius:8px;text-decoration:none;color:inherit}.lw-static-search__list a:hover,.lw-static-search__list a:focus-visible{background:var(--wp--preset--color--sunken)}' +
				'.lw-static-search__list small{display:block;font-family:var(--wp--preset--font-family--mono);font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--wp--preset--color--muted)}.lw-static-search__list strong{display:block;margin:.15rem 0}.lw-static-search__list span{display:block;font-size:.875rem;color:var(--wp--preset--color--muted)}';
			document.head.appendChild( style );
			dialog.addEventListener( 'click', function ( e ) {
				if ( e.target === dialog || e.target.closest( '.lw-static-search__close' ) ) {
					dialog.hidden = true;
				}
			} );
			document.addEventListener( 'keydown', function ( e ) {
				if ( e.key === 'Escape' && dialog && ! dialog.hidden ) {
					dialog.hidden = true;
				}
			} );
			dialog.querySelector( 'input' ).addEventListener( 'input', function ( e ) {
				render( e.target.value );
			} );
		}
		dialog.hidden = false;
		var input = dialog.querySelector( 'input' );
		input.value = q;
		input.focus();
		load().then( function () {
			render( q );
		} );
	}

	function render( q ) {
		var list = dialog.querySelector( '.lw-static-search__list' );
		var count = dialog.querySelector( '.lw-static-search__count' );
		if ( ! q.trim() || ! index ) {
			list.innerHTML = '';
			count.textContent = 'Suchbegriff eingeben, z. B. „ADR“, „Gateway“ oder „Bodenfeuchte“.';
			return;
		}
		var hits = search( q );
		count.textContent = hits.length ? hits.length + ' Treffer' + ( hits.length === 30 ? ' (die ersten 30)' : '' ) : 'Keine Treffer für „' + q + '“.';
		list.innerHTML = hits
			.map( function ( h ) {
				return '<li><a href="' + esc( root + h.e.u ) + '"><small>' + esc( h.e.k ) + '</small><strong>' + esc( h.e.t ) + '</strong><span>' + esc( h.e.d ) + '</span></a></li>';
			} )
			.join( '' );
	}

	document.addEventListener(
		'submit',
		function ( e ) {
			var form = e.target;
			var input = form.querySelector( 'input[type="search"], input[name="s"]' );
			if ( ! input ) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			show( input.value || '' );
		},
		true
	);
} )();
