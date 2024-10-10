import { remarkInstall } from 'fumadocs-docgen'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

export const { docs, meta } = defineDocs()

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      [
        remarkInstall,
        {
          persist: {
            id: 'pm',
          },
        },
      ],
    ],
  },
})
