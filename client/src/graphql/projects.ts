import { gql } from "@apollo/client";

export const CREATE_PROJECT = gql`
mutation CreateProject($input: NewProjectInput!) {
  createProject(input: $input) {
    id
    projectName
    createdAt
    lastEditedAt
    ownerId
    collaboratorIds
    rootFileId
  }
}
`;

