
const { gql } = require("apollo-server-express");

const typeDefs = gql`

  scalar Upload

  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    phone: String!
    password: String!
    createTime: String!
    token: String
    profileImage: String
    bio: String
    followers: [User]           # Suggestion System Support
    following: [User]           # Suggestion System Support
  }

  type OtpResponse {
    email: String!
    otp: Int!
    otpExpiryTime: String!
  }

  type Post {
    id: ID!
    caption: String
    imageUrl: String
    createdBy: ID
    createdAt: String
  }

  type Query {
    users: [User]
    getAllPosts: [Post]
     searchUsers(username: String!): [User]
    suggestedUsers(userId: ID!): [User]
  }

  type Mutation {
    requestOtp(
      name: String!
      username: String!
      email: String!
      password: String!
      phone: String!
    ): OtpResponse

    registerUser(email: String!, otp: Int!): User

    login(email: String!, password: String!): User

    logout: String

    changePassword(
      email: String!
      oldPassword: String!
      newPassword: String!
    ): String

    createPost(id: ID, caption: String!, image: Upload!): Post

    editProfile(
      id: ID
      name: String
      username: String
      caption: String
      image: Upload
    ): User

    followAndUnfollow(id: ID!): User
    getUserInformation(id: ID!): User
  }
`;

module.exports = typeDefs;

