import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: 'postgresql://postgres:Ticamet250@localhost:5432/devcollab',
  },
})

// Ticamet250&moon2468