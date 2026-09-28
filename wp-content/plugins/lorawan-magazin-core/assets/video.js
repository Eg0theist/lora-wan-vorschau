/* 2-Klick-Video: iframe erst nach Zustimmung einsetzen. */
document.addEventListener( 'click', function ( e ) {
	var btn = e.target.closest( '[data-lwc-video-play]' );
	if ( ! btn ) {
		return;
	}
	var fig = btn.closest( '[data-lwc-video]' );
	var frame = document.createElement( 'iframe' );
	frame.src = fig.getAttribute( 'data-lwc-video' );
	frame.title = 'YouTube-Video';
	frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
	frame.allowFullscreen = true;
	fig.innerHTML = '';
	fig.appendChild( frame );
} );
