//var url = 'http://localhost:8989';
var url = 'http://stoutapp.com:8989',
	db = window.openDatabase("stout", "1.0", "Stout DB", 1000000),
	user_id = 0,
	username = null,
	circular_loader = '<div id="circular3dG"><div id="circular3d_1G" class="circular3dG"></div><div id="circular3d_2G" class="circular3dG"></div><div id="circular3d_3G" class="circular3dG"></div><div id="circular3d_4G" class="circular3dG"></div><div id="circular3d_5G" class="circular3dG"></div><div id="circular3d_6G" class="circular3dG"></div><div id="circular3d_7G" class="circular3dG"></div><div id="circular3d_8G" class="circular3dG"></div></div>';