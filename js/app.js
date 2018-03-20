/*global value*/
let map;
let userLocation = {
    lat: 40.766959,
    lng: -73.985181
};
let initLoc = [];
let markers = [];
let currentMarker = [];
let largeInfowindow;

//Four square的token
let token = 'BPIKMWGI3N3RG1WAQFZVK2MBI0FVHETJFMEJO3EGP1UUFTVQ';


/*这个本来是打算获取用户位置，然后显示用户周边的餐馆信息的。但是我发现有一点异步问题要处理，就是要保证
获取这个信息之后再执行谷歌地图的回调函数initMap，不然先执行initMap的话哪个userLocation是空的会报错，这边不太清楚具体该怎么处理....
*/
//function getUserLocation() {
//    //这个函数的作用是获取用户的位置
//    if ('gelocation' in navigator) {
//        navigator.geolocation.getCurrentPosition(goSuccess);
//    } else {
//        
//    }
//    
//    function goSuccess(position) {
//        userLocation.lat = position.coords.latitude;
//        userLocation.lng = position.coords.longitude;
//    }
//}


/*这个函数的作用是初始化加载地图*/
function initMap() {

    //设置地图样式
    let styles = [
        {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [
                {
                    "saturation": "-100"
            }
        ]
    },
        {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "poi",
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "road",
            "elementType": "labels.text",
            "stylers": [
                {
                    "color": "#545454"
            }
        ]
    },
        {
            "featureType": "road",
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "saturation": "-87"
            },
                {
                    "lightness": "-40"
            },
                {
                    "color": "#ffffff"
            }
        ]
    },
        {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#f0f0f0"
            },
                {
                    "saturation": "-22"
            },
                {
                    "lightness": "-16"
            }
        ]
    },
        {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "road.highway.controlled_access",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "on"
            }
        ]
    },
        {
            "featureType": "road.arterial",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "road.local",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "visibility": "off"
            }
        ]
    },
        {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "saturation": "-52"
            },
                {
                    "hue": "#00e4ff"
            },
                {
                    "lightness": "-16"
            }
        ]
    }
];
    largeInfowindow = new google.maps.InfoWindow();
    /*创建map对象*/
    map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 18,
        styles: styles
    });

    let location = '40.766959, -73.985181';

    // 第三方API为foursquare，官方文档地址: https://developer.foursquare.com/docs
    // 采用jquery的AJAX获取数据
    let getNearbyPlace = $.ajax({
        url: 'https://api.foursquare.com/v2/venues/search',
        method: 'GET',
        data: {
            ll: location,
            oauth_token: token,
            v: '20180311',
            radius: '500'
        }
    })

    //有返回值
    getNearbyPlace.done(function (data) {
        // 返回状态等于200时
        if (data.meta.code == 200) {
            for (let eachPlace of data.response.venues) {
                /*将该地点mark出来*/
                createMarkerInfoWindow(eachPlace, largeInfowindow);
                initLoc.push(eachPlace);
            }
            //加入一个点的时候调整地图的试图
            fitMap();
            //使用knockout绑定DOM对象
            ko.applyBindings(new viewModel());
        } else {
            //返回状态失败的时候提示
            sweetNote('Foursquare');
        }
    });

    //返回失败
    getNearbyPlace.fail(function (error) {
        //提示错误
        sweetNote('Foursquare');
    });

    //增加mark到地图的时候扩展用户的视图
    function fitMap() {
        let bounds = new google.maps.LatLngBounds();

        for (let eachMark of markers) {
            eachMark.setMap(map);
            bounds.extend(eachMark.position);
        }
        map.fitBounds(bounds);
    }
}

//提示错误的函数
function sweetNote(source) {
    swal({
        type: 'error',
        title: 'Oops',
        text: `Sorry, cannot get the data from the ${source}!`
    })
}


/*创建Marker和InfoWindow的函数*/
function createMarkerInfoWindow(place, infowindow) {

    let defaultIcon = makeMarkerIcon('ed5a5a');
    let highlightedIcon = makeMarkerIcon('FFFF24');

    let location = {
        lat: place.location.lat,
        lng: place.location.lng
    };

    /*new marker object*/
    let marker = new google.maps.Marker({
        map: map,
        title: place.name,
        animation: google.maps.Animation.DROP,
        position: location,
        id: place.id
    });

    markers.push(marker);
    //点击marker的时候，弹出街景显示
    marker.addListener('click', function () {
        populateInfoWindow(this, largeInfowindow)
    });

    marker.setIcon(defaultIcon);

    //滑动鼠标marker时候显示的效果
    marker.addListener('mouseover', function () {
        this.setIcon(highlightedIcon);
    });

    //鼠标移出marker显示的效果
    marker.addListener('mouseout', function () {
        this.setIcon(defaultIcon);
    });
}


//创建Marker标志的函数
function makeMarkerIcon(markerColor) {
    let markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34)
    );
    return markerImage;
}

//弹出infowindow
function populateInfoWindow(marker, infowindow) {
    //创建Marker
    if (infowindow.marker != marker) {

        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });

        let radius = 10;
        let streetViewService = new google.maps.StreetViewService();
        let getPhoto, panoramaOptions;

        //获取街景的回掉函数
        function getStreetView(data, status) {

            //先通过AJAX请求Foursquare的API地点图片
            getPhoto = $.ajax({
                url: `https://api.foursquare.com/v2/venues/${marker.id}/photos`,
                method: 'GET',
                data: {
                    oauth_token: token,
                    v: '20180311'
                }
            })

            // 如果google街景状态响应正常
            if (status == google.maps.StreetViewStatus.OK) {
                let nearStreetViewLocation = data.location.latLng;
                let heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
                infowindow.setContent(`<div class="marker-title">${marker.title}</div><div id="pano"></div>`);
                panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };

            } else {
                infowindow.setContent(`<div class="marker-title">${marker.title}</div><div class="not-found">No StreetView Found!</div>`);
            }

            getPhoto.done(function (data) {
                //返回正常
                if (data.meta.code == 200) {
                    if (data.response.photos.count > 0) {

                        let prefix = data.response.photos.items["0"].prefix;
                        let size = data.response.photos.items["0"].width + 'x' + data.response.photos.items["0"].height;
                        let suffix = data.response.photos.items["0"].suffix;
                        let url = prefix + size + suffix;

                        infowindow.setContent(`<div class="infowindow">` + infowindow.content + `<div class="info-img"><img src=${url}></div></div>`);

                        let panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);

                    } else {

                        infowindow.setContent(`<div class="infowindow">` + infowindow.content + `<div class="info-no-img">Image Not found</div></div>`);
                        let panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
                    }

                } else {
                    infowindow.setContent(`<div class="infowindow">` + infowindow.content + `<div class="info-no-img">Image Not found</div></div>`);
                    let panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
                }
            })
        }
        //调取谷歌街景
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(map, marker);
    }
}



/*MVVM结构*/
/*采用Knock Out库编写*/
/*place object*/
let place = function (data) {
    this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
}

/*viewmodel*/
let viewModel = function () {

    let self = this;
    this.placeList = ko.observableArray([]);
    //用户输入一开始默认为空字符串
    this.keyword = ko.observable('');


    //动态绑定
    this.placeList = ko.computed(function () {
        //设置一个临时数组为空
        let temp = [];
        //遍历initLoc中地点，如果包含用户输入的关键，就PUSH到TEMP中
        initLoc.forEach(function (eachPlace) {
            //先转换成小写
            let lowerPlace = eachPlace.name.toLowerCase();
            //如果地点中包含这个字，那么就添加到temp数组中
            if (lowerPlace.includes(self.keyword().toLowerCase())) {
                temp.push(new place(eachPlace));
            }
        });
        return temp;
    });


    //当用户输入的时候，筛选marker
    this.fliterLocation = function (data, event) {
        for (each in markers) {
            let lowerCase = markers[each].title.toLowerCase();
            //匹配用户输入,筛选marker
            if (lowerCase.includes(data.keyword().toLowerCase())) {
                currentMarker.push(markers[each]);
                markers[each].setMap(map);
            } else {
                markers[each].setMap(null);
            }
        }
    }

    //绑定用户点击事件,弹出infowindow
    this.displayInfo = function (item, event) {
        let location = item.name();
        for (each in markers) {
            let lowerCase = markers[each].title.toLowerCase();

            //匹配用户输入,筛选marker
            if (lowerCase == location.toLowerCase()) {
                populateInfoWindow(markers[each], largeInfowindow);
                break;
            }
        }
    }

    this.highLight = function (item, event) {
        let highlightedIcon = makeMarkerIcon('FFFF24');
        let m;
        for (each in markers) {
            if (markers[each].title == item.name()) {
                m = markers[each];
                break;

            }
        }
        m.setIcon(highlightedIcon);
    }

    this.fade = function (item, event) {
        let defaultIcon = makeMarkerIcon('ed5a5a');
        let m;
        for (each in markers) {
            if (markers[each].title == item.name()) {
                m = markers[each];
                break;
            }
        }
        m.setIcon(defaultIcon);
    }
}