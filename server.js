const express = require("express");
const dotenv = require("dotenv");

const { ApolloServer, gql } = require("apollo-server-express");
const cors = require("cors");
const { GraphQLUpload, graphqlUploadExpress } = require("graphql-upload");
const { finished } = require("stream/promises");
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("apollo-server-core");
const fs = require("fs");
const path = require("path");
const { uploadToMinio } = require("./utils/minio-config");

// Load environment variables from .env file
dotenv.config();

const uploadBucket = process.env.UPLOAD_BUCKET;

const assetDir = path.join(__dirname, "asset");
if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir);
}

const typeDefs = gql`
  # The implementation for this scalar is provided by the
  # 'GraphQLUpload' export from the 'graphql-upload' package
  # in the resolver map below.
  scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
    url: String!
  }

  type Query {
    # This is only here to satisfy the requirement that at least one
    # field be present within the 'Query' type.  This example does not
    # demonstrate how to fetch uploads back.
    otherFields: Boolean!
    filename: String
  }

  type Mutation {
    # Multiple uploads are supported. See graphql-upload docs for details.
    singleUpload(file: Upload!): File!
    multipleUpload(files: [Upload!]!): [File!]!
  }
`;

const resolvers = {
  // This maps the `Upload` scalar to the implementation provided
  // by the `graphql-upload` package.
  Upload: GraphQLUpload,

  Mutation: {
    singleUpload: async (parent, { file }) => {
      const { createReadStream, filename, mimetype, encoding } = await file;

      // Generate a unique filename using timestamp
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${filename}`;

      // Invoking the `createReadStream` will return a Readable Stream.
      // See https://nodejs.org/api/stream.html#stream_readable_streams
      const stream = createReadStream();

      // Call the MinIO upload function with the stream, bucket name, and filename
      const fileUrl = await uploadToMinio(
        stream,
        uploadBucket,
        uniqueFileName,
        mimetype
      );

      // const outPath = path.join(assetDir, filename);
      // const out = fs.createWriteStream(outPath);
      // stream.pipe(out);
      // await finished(out);

      // return { filename, mimetype, encoding };

      return {
        filename: uniqueFileName,
        mimetype,
        encoding,
        url: fileUrl,
      };
    },

    multipleUpload: async (parent, { files }) => {
      const uploadPromises = files.map(async (file) => {
        const { createReadStream, filename, mimetype, encoding } = await file;

        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}_${filename}`;

        const stream = createReadStream();

        const fileUrl = await uploadToMinio(
          stream,
          uploadBucket,
          uniqueFileName,
          mimetype
        );

        return {
          filename: uniqueFileName,
          mimetype,
          encoding,
          url: fileUrl,
        };
      });

      return Promise.all(uploadPromises);
    },
  },
};

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // Using graphql-upload without CSRF prevention is very insecure.
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });
  await server.start();

  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-apollo-operation-name",
        "apollo-require-preflight",
      ],
    })
  ); // This middleware should be added before calling `applyMiddleware`.
  app.use(graphqlUploadExpress());

  server.applyMiddleware({ app });

  await new Promise((r) => app.listen({ port: 4000 }, r));

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

startServer();
