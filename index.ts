import { createFeedDatabase, createFeedFiles } from './action/feeds'
import {
  buildSite,
  getGithubActionPath,
  publish,
  setup
} from './action/repository'

async function run() {
  await setup()
  await createFeedDatabase(getGithubActionPath())
  await createFeedFiles(getGithubActionPath())
  buildSite()
  await publish()
}

run()
  .then(() => {
    console.log('Done')
  })
  .catch((error) => {
    console.error(error.message)
    console.error(error.stack)
  })
