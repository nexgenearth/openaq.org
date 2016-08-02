'use strict';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { formatThousands } from '../utils/format';
import { fetchLocations, invalidateAllLocationData, fetchLatestMeasurements } from '../actions/action-creators';
import { getMapColors } from '../utils/colors';
import InfoMessage from '../components/info-message';
import LocationCard from '../components/location-card';
import ShareBtn from '../components/share-btn';
import MapComponent from '../components/map';

var Country = React.createClass({
  displayName: 'Country',

  propTypes: {
    params: React.PropTypes.object,

    _invalidateAllLocationData: React.PropTypes.func,
    _fetchLocations: React.PropTypes.func,
    _fetchLatestMeasurements: React.PropTypes.func,

    countries: React.PropTypes.array,
    sources: React.PropTypes.array,
    parameters: React.PropTypes.array,

    latestMeasurements: React.PropTypes.shape({
      fetching: React.PropTypes.bool,
      fetched: React.PropTypes.bool,
      error: React.PropTypes.string,
      data: React.PropTypes.object
    }),

    locations: React.PropTypes.shape({
      fetching: React.PropTypes.bool,
      fetched: React.PropTypes.bool,
      error: React.PropTypes.string,
      data: React.PropTypes.object
    })
  },

  shouldFetchData: function (prevProps) {
    let prevCountry = prevProps.params.name;
    let currCountry = this.props.params.name;

    return prevCountry !== currCountry;
  },

  fetchData: function () {
    this.props._fetchLocations(1, {
      country: this.props.params.name
    }, 1000);
    this.props._fetchLatestMeasurements({country: this.props.params.name, has_geo: 'true'});
  },

  //
  // Start life-cycle methods
  //

  componentDidMount: function () {
    this.fetchData();
  },

  componentDidUpdate: function (prevProps) {
    // this.props._invalidateAllLocationData();
    this.shouldFetchData(prevProps) && this.fetchData();
  },

  //
  // Start render methods
  //

  renderCountryList: function () {
    let {fetched, fetching, error, data: {results}} = this.props.locations;
    if (!fetched && !fetching) {
      return null;
    }

    if (fetching) {
      return (<p>Data is loading</p>);
    }

    if (error) {
      return (
        <InfoMessage>
          <h2>Uhoh, something went wrong.</h2>
          <p>There was a problem getting the data. If the problem persists let us know.</p>
          <a href='mailto:info@openaq.org' title='Send us an email'>Send us an Email</a>
        </InfoMessage>
      );
    }

    let groupped = _(results)
      .sortBy('city')
      .groupBy('city')
      .value();

    let countriesList = _.map(groupped, (locations, k) => (
      <div key={k} className='card-group'>
        <div className='card-group__header'>
          <h2>{k} <small>{locations.length} {locations.length > 1 ? 'locations' : 'location'}</small></h2>
          <div className='card-group__actions'>
            <a href='#' className='button-inpage-download'>Download</a>
          </div>
        </div>
        <div className='card-group__contents'>
          {locations.map(o => {
            let countryData = _.find(this.props.countries, {code: o.country});
            let sourceData = _.find(this.props.sources, {name: o.sourceName});
            let params = o.parameters.map(o => _.find(this.props.parameters, {id: o}));
            return <LocationCard
                    key={o.location}
                    name={o.location}
                    city={o.city}
                    countryData={countryData}
                    sourceData={sourceData}
                    totalMeasurements={o.count}
                    parametersList={params}
                    lastUpdate={o.lastUpdated}
                    collectionStart={o.firstUpdated}
                    compact />;
          })}
        </div>
      </div>
    ));

    return (
      <div className='countries-list'>
        {countriesList}
      </div>
    );
  },

  renderMap: function () {
    let {fetched, fetching, error, data: {results}} = this.props.latestMeasurements;
    if (!fetched && !fetching) {
      return null;
    }

    if (fetching) {
      return (<p>Data is loading</p>);
    }

    if (error) {
      return (
        <InfoMessage>
          <h2>Uhoh, something went wrong.</h2>
          <p>There was a problem getting the data. If the problem persists let us know.</p>
          <a href='mailto:info@openaq.org' title='Send us an email'>Send us an Email</a>
        </InfoMessage>
      );
    }

    const mapColors = getMapColors();
    const colorWidth = 100 / mapColors.length;

    return (
      <div className='country-map'>
        <MapComponent
          center={[0, 0]}
          zoom={1}
          measurements={results}
          parameter={_.find(this.props.parameters, {id: 'pm25'})}
          disableScrollZoom >
            <div>
              <p>Showing most recent values for PM2.5</p>
              <ul className='color-scale'>
                {mapColors.map(o => (
                  <li key={o.label} style={{'backgroundColor': o.color, width: `${colorWidth}%`}} className='color-scale__item'><span className='color-scale__value'>{o.label}</span></li>
                ))}
              </ul>
            </div>
        </MapComponent>
      </div>
    );
  },

  render: function () {
    let countryData = _.find(this.props.countries, {code: this.props.params.name});
    let sourcesData = _.filter(this.props.sources, {country: this.props.params.name});

    return (
      <section className='inpage'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'>{countryData.name}</h1>
              <div className='inpage__headline-actions'>
                <ShareBtn />
              </div>
            </div>
            <div>
              <ul className='country-stats'>
                <li><strong>{countryData.cities}</strong> areas</li>
                <li><strong>{countryData.locations}</strong> locations</li>
                <li><strong>{formatThousands(countryData.count)}</strong> measurements</li>
                <li><strong>{sourcesData.length}</strong> {sourcesData.length > 1 ? 'sources' : 'source'}</li>
              </ul>
            </div>
            <div className='inpage__actions'>
              <ul>
                <li><a href='' title='View API documentation' className='button-inpage-api'>View API Docs</a></li>
                <li><a href='#' className='button-inpage-download'>Download</a></li>
              </ul>
            </div>
          </div>
        </header>
        <div className='inpage__body'>

          <div className='fold'>
            <div className='inner'>
              <div className='fold__body'>
                {this.renderMap()}
                {this.renderCountryList()}
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

function selector (state) {
  return {
    countries: state.baseData.data.countries,
    sources: state.baseData.data.sources,
    parameters: state.baseData.data.parameters,

    latestMeasurements: state.latestMeasurements,
    locations: state.locations
  };
}

function dispatcher (dispatch) {
  return {
    _fetchLocations: (...args) => dispatch(fetchLocations(...args)),
    _fetchLatestMeasurements: (...args) => dispatch(fetchLatestMeasurements(...args)),
    _invalidateAllLocationData: (...args) => dispatch(invalidateAllLocationData(...args))
  };
}

module.exports = connect(selector, dispatcher)(Country);
