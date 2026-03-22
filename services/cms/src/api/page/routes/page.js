'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::page.page', {
  config: {
    find: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::page.page' },
        },
      ],
    },
    findOne: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::page.page' },
        },
      ],
    },
    create: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::page.page' },
        },
      ],
    },
    update: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::page.page' },
        },
      ],
    },
    delete: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::page.page' },
        },
      ],
    },
  },
});
