// @ts-check
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { knex } = require('knex')

function hash(/** @type {string} */ input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function getDatabase(/** @type {string} */ contentDirectory) {
  try {
    const stats = fs.statSync(contentDirectory)
    if (!stats.isDirectory()) {
      throw new Error(`${contentDirectory} is not a directory`)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Fail to access ${contentDirectory}`)
    }
    fs.mkdirSync(contentDirectory, { recursive: true })
  }

  const databasePath = path.join(contentDirectory, 'data.sqlite3')
  console.log('Database path', databasePath)
  return knex({
    client: 'sqlite3',
    connection: {
      filename: databasePath
    },
    useNullAsDefault: true
  })
}
exports.getDatabase = getDatabase

async function createSchema(/** @type {import('knex').Knex} */ knex) {
  if (!(await knex.schema.hasTable('Categories'))) {
    await knex.schema.createTable('Categories', (table) => {
      table.string('name').primary()
    })
  }

  if (!(await knex.schema.hasTable('Sites'))) {
    await knex.schema.createTableIfNotExists('Sites', (table) => {
      table.string('key').primary()
      table.string('title').notNullable()
      table.string('url').nullable()
      table.string('description')
      table.integer('createdAt')
    })
  }

  if (!(await knex.schema.hasTable('SiteCategories'))) {
    await knex.schema.createTableIfNotExists('SiteCategories', (table) => {
      table.string('category').notNullable()
      table.string('siteKey').notNullable()
      table.string('siteTitle').notNullable()
      table.index(['category', 'siteKey'], 'site_category_idx')
    })
  }

  if (!(await knex.schema.hasTable('Entries'))) {
    await knex.schema.createTable('Entries', (table) => {
      table.string('key').primary()
      table.string('siteKey').notNullable()
      table.string('siteTitle').notNullable()
      table.string('title').notNullable()
      table.string('url').notNullable()
      table.text('content').notNullable()
      table.integer('contentTime').nullable()
      table.integer('createdAt').notNullable()
      table.index(
        ['siteKey', 'contentTime', 'createdAt'],
        'site_content_time_created_at_idx'
      )
    })
  }

  if (!(await knex.schema.hasTable('EntryCategories'))) {
    await knex.schema.createTable('EntryCategories', (table) => {
      table.string('category').notNullable()
      table.string('entryKey').notNullable()
      table.string('entryTitle').notNullable()
      table.string('siteKey').notNullable()
      table.string('siteTitle').notNullable()
      table.string('entryContentTime').nullable()
      table.index(
        ['category', 'siteKey', 'entryKey'],
        'category_siteKey_entryKey_idx'
      )
    })
  }
}
exports.createSchema = createSchema

async function insertCategory(
  /** @type {import('knex').Knex} */ knex,
  /** @type {string} */ category
) {
  try {
    await knex.transaction(async (trx) => {
      const record = await trx('Categories').where('name', category).first()
      if (record) return
      console.log(category)
      await trx('Categories').insert({ name: category })
    })
  } catch (error) {
    console.error(`Fail to insert ${category}`)
  }
}
exports.insertCategory = insertCategory

async function isEntryExists(
  /** @type {import('knex').Knex} */ knex,
  /** @type {import('./parsers').Entry}*/ entry
) {
  const key = hash(`${entry.title}${entry.link}`)
  const existingEntry = await knex('Entries')
    .where('key', key)
    .count('* as total')
    .first()
  return existingEntry['total'] === 1
}
exports.isEntryExists = isEntryExists

async function insertEntry(
  /** @type {import('knex').Knex} */ knex,
  /** @type {string} */ siteKey,
  /** @type {string} */ siteTitle,
  /** @type {string} */ category,
  /** @type {import('./parsers').Entry}*/ entry
) {
  const key = hash(`${entry.title}${entry.link}`)
  const existingEntry = await knex('Entries').where('key', key).first()
  if (existingEntry) return

  const contentTime = (entry.date && Math.floor(entry.date / 1000)) || null
  await knex('Entries').insert({
    key,
    siteKey,
    siteTitle,
    title: entry.title,
    url: entry.link,
    content: entry.content,
    contentTime,
    createdAt: Math.floor(Date.now() / 1000)
  })
  await knex('EntryCategories').insert({
    category,
    entryKey: key,
    entryTitle: entry.title,
    siteKey,
    siteTitle,
    entryContentTime: contentTime
  })
}
exports.insertEntry = insertEntry

async function insertSite(
  /** @type {import('knex').Knex} */ knex,
  /** @type {string} */ category,
  /** @type {import('./parsers').Site} */ site
) {
  try {
    const key = await knex.transaction(async (trx) => {
      const key = hash(site.title)
      const updatedAt = site.updatedAt || Date.now()
      const siteCategory = await trx('SiteCategories')
        .where('category', category)
        .andWhere('siteKey', key)
        .first()
      if (siteCategory) return
      await trx('SiteCategories').insert({
        category,
        siteKey: key,
        siteTitle: site.title
      })

      const insertedSite = await trx('Sites').where('key', key).first()
      if (insertedSite) return

      await trx('Sites').insert({
        key,
        title: site.title,
        url: site.link || null,
        description: site.description || null,
        createdAt: Math.floor(updatedAt / 1000)
      })
      return key
    })
    return key
  } catch (error) {
    console.error(`Fail to insert site ${site.title}`)
    console.error(error.message)
    return null
  }
}
exports.insertSite = insertSite

async function cleanup(/** @type {import('knex').Knex} */ knex) {
  await knex.raw('pragma journal_mode = delete')
  await knex.raw('pragma page_size = 4096')
  await knex.raw('vacuum')
}
exports.cleanup = cleanup
