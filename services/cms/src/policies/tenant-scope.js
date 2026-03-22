'use strict';

/**
 * Multi-tenant scope for collection types with a `client` relation.
 *
 * - Authenticated users: force `filters.client` to their `user.client` (read) and
 *   set `data.client` on writes; verify ownership on findOne/update/delete by id.
 * - Unauthenticated GET: allowed only when listing is scoped by `client` (slug or id),
 *   matching public Next.js usage: `filters[client][slug][$eq]=...`
 * - Unauthenticated findOne by numeric id: denied (avoid cross-tenant ID enumeration).
 * - Mutations without auth: denied.
 */
module.exports = async (policyContext, config, { strapi }) => {
  const { ctx } = policyContext;
  const uid = config.uid;
  if (!uid) {
    return false;
  }

  const method = ctx.request.method;
  const user = ctx.state.user;

  if (!user) {
    if (method === 'GET' || method === 'HEAD') {
      if (ctx.params?.id) {
        return false;
      }
      const filters = ctx.query?.filters || {};
      const clientSlug = filters?.client?.slug?.$eq;
      const clientId = filters?.client?.id?.$eq;
      if (!clientSlug && !clientId) {
        return false;
      }
      return true;
    }
    return false;
  }

  const fullUser = await strapi.entityService.findOne(
    'plugin::users-permissions.user',
    user.id,
    { populate: ['client'] }
  );

  const clientId = fullUser?.client?.id;
  if (!clientId) {
    return false;
  }

  const mergeClientFilter = () => {
    const q = ctx.query || {};
    ctx.query = {
      ...q,
      filters: {
        ...(q.filters || {}),
        client: { id: { $eq: clientId } },
      },
    };
  };

  if (method === 'GET' || method === 'HEAD') {
    mergeClientFilter();
    const id = ctx.params?.id;
    if (id) {
      const existing = await strapi.entityService.findOne(uid, id, {
        populate: ['client'],
      });
      if (!existing || existing.client?.id !== clientId) {
        return false;
      }
    }
    return true;
  }

  if (method === 'POST') {
    if (ctx.request.body?.data) {
      ctx.request.body.data.client = clientId;
    }
    return true;
  }

  if (method === 'PUT' || method === 'PATCH') {
    const id = ctx.params?.id;
    if (id) {
      const existing = await strapi.entityService.findOne(uid, id, {
        populate: ['client'],
      });
      if (!existing || existing.client?.id !== clientId) {
        return false;
      }
    }
    if (ctx.request.body?.data) {
      ctx.request.body.data.client = clientId;
    }
    return true;
  }

  if (method === 'DELETE') {
    const id = ctx.params?.id;
    if (id) {
      const existing = await strapi.entityService.findOne(uid, id, {
        populate: ['client'],
      });
      if (!existing || existing.client?.id !== clientId) {
        return false;
      }
    }
    return true;
  }

  return true;
};
