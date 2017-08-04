'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (attribute) {
    //allow user to personally set joi objects in models, mainly for JSON/B data types
    if (attribute.sequelizeToJoiOverride) {
        return attribute.sequelizeToJoiOverride;
    }

    var joi = mapType(_lodash2.default.get(attribute, 'type.key', ''), attribute);

    // Add model comments to schema description
    if (attribute.comment) {
        joi = joi.description(attribute.comment);
    }

    if (attribute.allowNull === false) {
        joi = joi.required();
    } else {
        joi = joi.allow(null);
    }

    if (attribute.defaultValue && !_lodash2.default.isObject(attribute.defaultValue) && !_lodash2.default.isFunction(attribute.defaultValue)) {
        joi = joi.default(attribute.defaultValue);
    }

    _lodash2.default.each(attribute.validate, function (validator, key) {
        joi = mapValidator(joi, validator, key);
    });

    return joi;
};

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VALID_GEOJSON_TYPES = ['Point', 'Linestring', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection', 'FeatureCollection', 'Feature'];

function createGeoJSONValidator() {
    var geojsonBasic = _joi2.default.object({
        type: _joi2.default.string().valid(VALID_GEOJSON_TYPES).insensitive(),
        coordinates: _joi2.default.array().sparse(),
        bbox: _joi2.default.array().sparse(),
        properties: _joi2.default.object(),
        crs: _joi2.default.object({
            type: _joi2.default.string().valid('name', 'link').insensitive().required(),
            properties: _joi2.default.object().required()
        })
    });
    //set child keys to original joi object
    geojsonBasic = geojsonBasic.keys({
        geometry: geojsonBasic,
        geometries: _joi2.default.array().items(geojsonBasic).sparse(),
        features: _joi2.default.array().items(geojsonBasic).sparse()
    });
    //add new and improved geojson object to the object again so that the structure is circular
    return geojsonBasic.keys({
        geometry: geojsonBasic,
        geometries: _joi2.default.array().items(geojsonBasic).sparse(),
        features: _joi2.default.array().items(geojsonBasic).sparse()
    });
}

function createNonIntegerValidator(attr) {
    var j = _joi2.default.number();
    if (!attr.type) {
        return j;
    }
    if (attr.type._length) {
        var bound = Math.pow(10, attr.type._length);
        j = j.less(bound).greater(-1 * bound);
    }
    if (attr.type._decimals) {
        j = j.precision(attr.type._decimals).strict();
    }
    return j;
}

function mapType(key, attribute) {
    switch (key) {
        // NUMBER TYPES
        case 'BIGINT':
        case 'INTEGER':
            return _joi2.default.number().integer();

        case 'DECIMAL':
        case 'DOUBLE':
        case 'FLOAT':
        case 'REAL':
            return createNonIntegerValidator(attribute);

        // STRING TYPES
        case 'STRING':
        case 'TEXT':
            return _joi2.default.string();
        case 'UUID':
            return _joi2.default.string().guid();
        case 'ENUM':
            return _joi2.default.string().allow(attribute.values);

        case 'DATEONLY':
        case 'DATE':
            return _joi2.default.date();

        // OTHER TYPES
        case 'BLOB':
            return _joi2.default.any();
        case 'BOOLEAN':
            return _joi2.default.boolean();
        case 'JSON':
        case 'JSONB':
            return _joi2.default.alternatives().try(_joi2.default.array(), _joi2.default.object());
        case 'ARRAY':
            return _joi2.default.array().sparse().items(mapType(_lodash2.default.get(attribute, 'type.type.key', ''), attribute.type));
        case 'GEOMETRY':
            return createGeoJSONValidator();
        default:
            return _joi2.default.any();
    }
}

function mapValidator(joi, validator, key) {
    if (validator === false) {
        return joi;
    }

    switch (key) {
        case 'is':
            return joi.regex(validator);
        case 'isEmail':
            return joi.email();
        case 'isUrl':
            return joi.uri();
        case 'isIP':
            return joi.ip();
        case 'isIPv4':
            return joi.ip({ version: ['ipv4'] });
        case 'isIPv6':
            return joi = joi.ip({ version: ['ipv6'] });
        case 'min':
            return joi.min(validator);
        case 'max':
            return joi.max(validator);
        case 'notEmpty':
            return joi.min(1);
        default:
            return joi;
    }
}

module.exports = exports['default'];