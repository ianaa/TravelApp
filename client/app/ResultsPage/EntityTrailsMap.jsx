import React, { Component, PropTypes } from 'react';
import { FancyBorder } from '../helpers';

class EntityTrailsMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      mapRef: null,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.state.mapRef || this.props.trails !== nextProps.trails) {
      return true;
    }
    return false;
  }

  getMapRef(node) {
    this.setState({
      mapRef: node,
    }, () => {
      this.setState({
        map: this.initMap(this.state.mapRef),
      }, () => { this.createTrailMarkers(this.state.map); });
    });
  }

  initMap(mapRef) {
    // create a map and link it to a dom element
    const map = new google.maps.Map(mapRef, {
      center: { lat: this.props.center[0], lng: this.props.center[1] },
      zoom: 8,
      mapTypeId: 'terrain',
    });
    // make a marker for the entity
    const entityMarker = new google.maps.Marker({
      position: { lat: this.props.center[0], lng: this.props.center[1] },
      map,
      animation: google.maps.Animation.DROP,
    });
    // make an infowindow for the entity
    const infoWindow = new google.maps.InfoWindow({
      content: this.props.entityName,
    });
    // add an event listener to open the infowindow on click
    entityMarker.addListener('click', () => {
      infoWindow.open(map, entityMarker);
    });
    // open the infowindow on render
    infoWindow.open(map, entityMarker);
    return map;
  }


  createTrailMarkers(map) {
    const infoWindow = new google.maps.InfoWindow();
    const trailMarkers = this.props.trails.map((trail) => {
      // create a marker for each trail:
      const marker = new google.maps.Marker({
        position: { lat: trail.coordinates[0][0], lng: trail.coordinates[0][1] },
        icon: './maps/icons/hiking2.png',
        map,
        title: trail.name,
      });
      // create a polyline for each trail to draw it on the map/to open an infowindow:
      const path = this.createPolyline(trail);
      let showPath = true;
      // add an event listener that shows/hides the trail when clicked:
      marker.addListener('click', () => {
        infoWindow.setContent(this.makeInfoWindowHtml(trail));
        // draw an elevation chart, if got data:
        showPath ? path.setMap(map) : path.setMap(null);
        showPath ? infoWindow.open(map, marker) : infoWindow.close();
        if (trail.profile) {
          infoWindow.setContent(this.makeInfoWindowHtml(trail));
          this.drawElevationChart(trail.profile.elevationProfile);
        }
        showPath = !showPath;
      });

      return marker;
    });
    // show trail markers in clusters:
    return new MarkerClusterer(map, trailMarkers, { imagePath: './maps/img/m' });
  }

  createPolyline(trail) {
    // create a polyline object
    const trailPath = new google.maps.Polyline({
      path: trail.coordinates.map(point => ({ lat: point[0], lng: point[1] })),
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    return trailPath;
  }
  makeInfoWindowHtml(trail) {
    return (
        `<h5><Glyphicon glyph="arrow-up" />${trail.name}</h5>
        <p>${trail.length} miles</p>
        <div>
          <span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span>
          <span>${trail.up ? `${trail.up}ft` : '<img src="./maps/icons/loading.gif"'}</span>
          <span class="glyphicon glyphicon-arrow-down" aria-hidden="true"></span>
          <span>${trail.down ? `${trail.down}ft` : '<img src="./maps/icons/loading.gif"'}</span>
        </div>`
    );
  }

  drawElevationChart(elevations) {
    const chart = new google.visualization.AreaChart(document.getElementById('chartContainer'));
    const data = google.visualization.arrayToDataTable(
      [['Distance', 'Height']].concat(
      elevations.map(({ distance, height }) => ([distance, height]))),
    );
    // Draw the chart using the data within its DIV.
    chart.draw(data, {
      height: 175,
      legend: 'none',
      titleY: 'Elevation (ft)',
      titleX: 'Distance (mi)',
    });
  }

  render() {
    return (
      <FancyBorder color="green">
        <div className="modalMap container-fluid" ref={(map) => { this.getMapRef(map); }} />
      </FancyBorder>
    );
  }
}

EntityTrailsMap.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number),
  trails: PropTypes.arrayOf(PropTypes.object),
  entityID: PropTypes.number,
  entityName: PropTypes.string,
};

export default EntityTrailsMap;
