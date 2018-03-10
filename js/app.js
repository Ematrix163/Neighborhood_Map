/*global value*/
let map;
let userLocation = {lat: 53.3439,lng: -6.2672};
let initLoc = [];
let markers = [];
let currentMarker = [];

/*This function is to get the user's location*/
function geoSuccess(position) {
    userLocation = {'lat': position.coords.latitude, 'lng': position.coords.longitude};
}


function initMap() {
    let styles = [
          {
            featureType: 'water',
            stylers: [
              { color: '#19a0d8' }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
              { color: '#ffffff' },
              { weight: 6 }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
              { color: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -40 }
            ]
          },{
            featureType: 'transit.station',
            stylers: [
              { weight: 9 },
              { hue: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
              { visibility: 'off' }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
              { lightness: 100 }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
              { lightness: -100 }
            ]
          },{
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
              { visibility: 'on' },
              { color: '#f0e4d3' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -25 }
            ]
          }
        ];
    /*This function is to initialize the google map.*/
    map = new google.maps.Map(document.getElementById('map'), {
        center:  userLocation,
        zoom: 15,
        styles: styles
    });
    
    
    let request = {location: userLocation,radius: '2000',types: ['restaurant']};
    let service = new google.maps.places.PlacesService(map);
    

    /* search nearby locations */
    service.nearbySearch(request,callback);
    
    let largeInfowindow = new google.maps.InfoWindow();
    
    function callback(results, status) {
        /*This is a callback function to handle the data of nearby search*/
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (let i = 0; i < results.length; i++) {
                /*将该地点mark出来*/
                createMarkerInfoWindow(results[i], largeInfowindow);
                
                /*添加该地点到初始化的对象中*/
                initLoc.push({name: results[i].name, id: results[i].id});
            }
        } else {
            //error handling
        }
        
        ko.applyBindings(new viewModel());
        /*理论上不应该写这里，先暂时写着，需要用promise执行异步*/
        
        
        /*绑定监听函数,弹出infowindow*/
        $('.option').click(function(){
            let name = $(this).text();
            for (each in markers) {
                if (markers[each].title == name) {
                    populateInfoWindow(markers[each], largeInfowindow);
                    break;
                }
            }
        });
    }

    /*创建Marker和InfoWindow的函数*/
    function createMarkerInfoWindow(place, infowindow) {    
        
        let defaultIcon = makeMarkerIcon('0091ff');
        let highlightedIcon = makeMarkerIcon('FFFF24');
        
        let location = {lat:place.geometry.viewport.f.f, lng:place.geometry.viewport.b.b}
        /*new marker object*/
        let marker = new google.maps.Marker({
            map: map,
            title: place.name,
            animation: google.maps.Animation.DROP,
            position: location
        });
        
        markers.push(marker);
        //点击marker的时候，弹出街景显示
        marker.addListener('click', function(){
            populateInfoWindow(this, largeInfowindow)
        });
        
        //滑动鼠标marker时候显示的效果
        marker.addListener('mouseover', function(){
           this.setIcon(highlightedIcon); 
        });
        
        //鼠标移出marker显示的效果
        marker.addListener('mouseout', function(){
            this.setIcon(defaultIcon);
        });
        
        
        //创建Marker标志的函数
        function makeMarkerIcon(markerColor){
            let markerImage = new google.maps.MarkerImage(
                'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +'|40|_|%E2%80%A2',
                new google.maps.Size(21, 34),
                new google.maps.Point(0, 0),
                new google.maps.Point(10, 34),
                new google.maps.Size(21,34)  
            );
            return markerImage;
        }
    }
    
    
    //弹出infowindow
    function populateInfoWindow(marker, infowindow) {
        //创建Marker
        if (infowindow.marker != marker) {

            infowindow.marker = marker;
            infowindow.setContent('<div>'+marker.title + '</div>');
            infowindow.addListener('closeclick', function(){
                infowindow.marker = null;
            });
            let radius = 10;
            let streetViewService = new google.maps.StreetViewService();

            //获取街景的函数
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
                } else {
                    infowindow.setContent('<div>' + marker.title + '</div>' + '<div>No Street View Found</div>');
                }
            }
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            infowindow.open(map, marker);
            }
        }
}






/*MVVM结构*/
/*采用Knock Out库编写*/
/*place object*/
let place = function(data) {
    this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
}

/*viewmodel*/
let viewModel = function() {
    let self = this;
    this.placeList = ko.observableArray([]);
    //用户输入一开始默认为空字符串
    this.keyword = ko.observable(''); 
    //动态绑定
    this.placeList = ko.computed(function(){
        //设置一个临时数组为空
        let temp = [];
        //遍历initLoc中地点，如果包含用户输入的关键，就PUSH到TEMP中
        initLoc.forEach(function(eachPlace){
            //先转换成小写
            let lowerPlace = eachPlace.name.toLowerCase();
            //如果地点中包含这个字，那么就添加到temp数组中
            if (lowerPlace.includes(self.keyword().toLowerCase())) {
                temp.push(new place(eachPlace));
            }
        });
        return temp;
    });
    

}

/*监听用户输入，帅选marker标志*/
$('#location').on("change paste keyup", function(){
    for (each in markers) {
        let lowerCase = markers[each].title.toLowerCase();
        //匹配用户输入,筛选marker
        if (lowerCase.includes($(this).val().toLowerCase())) {
            currentMarker.push(markers[each]);
            markers[each].setMap(map);
        } else {
            markers[each].setMap(null);
        }
    } 
});








