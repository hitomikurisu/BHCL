jQuery(document).ready(function($) {
	jQuery('.drawer-hamburger-icon, #sp-header-navigation li, .drawer_head').on('click', function() {
		$('.drawer-navi').toggleClass('drawer-open');
		if(jQuery('.m-drawer .drawer-list').css('display') === 'block') {
			jQuery('.m-drawer .drawer-list').slideUp('1500');
		}else {
			jQuery('.m-drawer .drawer-list').slideDown('1500');
		}
	});

});

