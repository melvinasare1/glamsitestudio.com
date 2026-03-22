'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::subscription.subscription', {
  config: {
    find: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::subscription.subscription' },
        },
      ],
    },
    findOne: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::subscription.subscription' },
        },
      ],
    },
    create: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::subscription.subscription' },
        },
      ],
    },
    update: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::subscription.subscription' },
        },
      ],
    },
    delete: {
      policies: [
        {
          name: 'global::tenant-scope',
          config: { uid: 'api::subscription.subscription' },
        },
      ],
    },
  },
});
