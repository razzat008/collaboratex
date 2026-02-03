import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
import * as ApolloReactHooks from "@apollo/client/react";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type Asset = {
  __typename?: "Asset";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  mimeType: Scalars["String"]["output"];
  path: Scalars["String"]["output"];
  projectId: Scalars["ID"]["output"];
  size: Scalars["Int"]["output"];
};

export type CreateAssetInput = {
  mimeType: Scalars["String"]["input"];
  path: Scalars["String"]["input"];
  projectId: Scalars["ID"]["input"];
  size: Scalars["Int"]["input"];
};

export type CreateTemplateInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  isPublic: Scalars["Boolean"]["input"];
  name: Scalars["String"]["input"];
  tags: Array<Scalars["String"]["input"]>;
};

export type CreateVersionInput = {
  message?: InputMaybe<Scalars["String"]["input"]>;
  projectId: Scalars["ID"]["input"];
};

export type File = {
  __typename?: "File";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  projectId: Scalars["ID"]["output"];
  type: FileType;
  updatedAt: Scalars["String"]["output"];
  workingFile: WorkingFile;
};

export type FileType =
  | "BIB"
  | "CLS"
  | "FLS"
  | "OTHER"
  | "STY"
  | "TEX"
  | "%future added value";

export type Mutation = {
  __typename?: "Mutation";
  addCollaborator: Project;
  createAsset: Asset;
  createFile: File;
  createProject: Project;
  createTemplate: Template;
  createVersion: Version;
  deleteFile: Scalars["Boolean"]["output"];
  deleteProject: Scalars["Boolean"]["output"];
  removeCollaborator: Project;
  renameFile: File;
  restoreVersion: Project;
  updateWorkingFile: WorkingFile;
};

export type MutationAddCollaboratorArgs = {
  projectId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationCreateAssetArgs = {
  input: CreateAssetInput;
};

export type MutationCreateFileArgs = {
  input: NewFileInput;
};

export type MutationCreateProjectArgs = {
  input: NewProjectInput;
};

export type MutationCreateTemplateArgs = {
  input: CreateTemplateInput;
};

export type MutationCreateVersionArgs = {
  input: CreateVersionInput;
};

export type MutationDeleteFileArgs = {
  fileId: Scalars["ID"]["input"];
};

export type MutationDeleteProjectArgs = {
  projectId: Scalars["ID"]["input"];
};

export type MutationRemoveCollaboratorArgs = {
  projectId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationRenameFileArgs = {
  fileId: Scalars["ID"]["input"];
  name: Scalars["String"]["input"];
};

export type MutationRestoreVersionArgs = {
  versionId: Scalars["ID"]["input"];
};

export type MutationUpdateWorkingFileArgs = {
  input: UpdateWorkingFileInput;
};

export type NewFileInput = {
  name: Scalars["String"]["input"];
  projectId: Scalars["ID"]["input"];
  type: FileType;
};

export type NewProjectInput = {
  projectName: Scalars["String"]["input"];
};

export type Project = {
  __typename?: "Project";
  assets: Array<Asset>;
  collaboratorIds: Array<Scalars["ID"]["output"]>;
  createdAt: Scalars["String"]["output"];
  files: Array<File>;
  id: Scalars["ID"]["output"];
  lastEditedAt: Scalars["String"]["output"];
  ownerId: Scalars["ID"]["output"];
  projectName: Scalars["String"]["output"];
  rootFileId: Scalars["ID"]["output"];
  versions: Array<Version>;
};

export type Query = {
  __typename?: "Query";
  file?: Maybe<File>;
  project?: Maybe<Project>;
  projects: Array<Project>;
  version?: Maybe<Version>;
  workingFile?: Maybe<WorkingFile>;
};

export type QueryFileArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryProjectArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryVersionArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryWorkingFileArgs = {
  fileId: Scalars["ID"]["input"];
};

export type Subscription = {
  __typename?: "Subscription";
  projectUpdated: Project;
  workingFileUpdated: WorkingFile;
};

export type SubscriptionProjectUpdatedArgs = {
  projectId: Scalars["ID"]["input"];
};

export type SubscriptionWorkingFileUpdatedArgs = {
  projectId: Scalars["ID"]["input"];
};

export type Template = {
  __typename?: "Template";
  assets: Array<TemplateAsset>;
  authorId: Scalars["ID"]["output"];
  createdAt: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  files: Array<TemplateFile>;
  id: Scalars["ID"]["output"];
  isPublic: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  previewImage?: Maybe<Scalars["String"]["output"]>;
  tags: Array<Scalars["String"]["output"]>;
};

export type TemplateAsset = {
  __typename?: "TemplateAsset";
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  mimeType: Scalars["String"]["output"];
  path: Scalars["String"]["output"];
  size: Scalars["Int"]["output"];
  templateId: Scalars["ID"]["output"];
};

export type TemplateFile = {
  __typename?: "TemplateFile";
  content: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  templateId: Scalars["ID"]["output"];
  type: FileType;
};

export type UpdateWorkingFileInput = {
  content: Scalars["String"]["input"];
  fileId: Scalars["ID"]["input"];
};

export type User = {
  __typename?: "User";
  clerkUserId: Scalars["String"]["output"];
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
};

export type Version = {
  __typename?: "Version";
  createdAt: Scalars["String"]["output"];
  files: Array<VersionFile>;
  id: Scalars["ID"]["output"];
  message?: Maybe<Scalars["String"]["output"]>;
  projectId: Scalars["ID"]["output"];
};

export type VersionFile = {
  __typename?: "VersionFile";
  content: Scalars["String"]["output"];
  fileId: Scalars["ID"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  type: FileType;
  versionId: Scalars["ID"]["output"];
};

export type WorkingFile = {
  __typename?: "WorkingFile";
  content: Scalars["String"]["output"];
  fileId: Scalars["ID"]["output"];
  id: Scalars["ID"]["output"];
  projectId: Scalars["ID"]["output"];
  updatedAt: Scalars["String"]["output"];
};

export type ProjectFields = {
  __typename?: "Project";
  id: string;
  projectName: string;
  createdAt: string;
  lastEditedAt: string;
  ownerId: string;
  collaboratorIds: Array<string>;
  rootFileId: string;
  assets: Array<{
    __typename?: "Asset";
    id: string;
    projectId: string;
    path: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>;
};

export type FileFields = {
  __typename?: "File";
  id: string;
  projectId: string;
  name: string;
  type: FileType;
  createdAt: string;
  updatedAt: string;
};

export type FileWithContentFields = {
  __typename?: "File";
  id: string;
  projectId: string;
  name: string;
  type: FileType;
  createdAt: string;
  updatedAt: string;
  workingFile: {
    __typename?: "WorkingFile";
    id: string;
    fileId: string;
    projectId: string;
    content: string;
    updatedAt: string;
  };
};

export type AssetFields = {
  __typename?: "Asset";
  id: string;
  projectId: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type WorkingFileFields = {
  __typename?: "WorkingFile";
  id: string;
  fileId: string;
  projectId: string;
  content: string;
  updatedAt: string;
};

export type VersionFields = {
  __typename?: "Version";
  id: string;
  projectId: string;
  createdAt: string;
  message?: string | null;
};

export type VersionFileFields = {
  __typename?: "VersionFile";
  id: string;
  versionId: string;
  fileId: string;
  name: string;
  type: FileType;
  content: string;
};

export type GetProjectsVariables = Exact<{ [key: string]: never }>;

export type GetProjectsResult = {
  __typename?: "Query";
  projects: Array<{
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  }>;
};

export type GetProjectVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetProjectResult = {
  __typename?: "Query";
  project?: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    files: Array<{
      __typename?: "File";
      id: string;
      projectId: string;
      name: string;
      type: FileType;
      createdAt: string;
      updatedAt: string;
      workingFile: {
        __typename?: "WorkingFile";
        id: string;
        fileId: string;
        projectId: string;
        content: string;
        updatedAt: string;
      };
    }>;
    versions: Array<{
      __typename?: "Version";
      id: string;
      projectId: string;
      createdAt: string;
      message?: string | null;
    }>;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  } | null;
};

export type GetProjectWithoutContentVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetProjectWithoutContentResult = {
  __typename?: "Query";
  project?: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    files: Array<{
      __typename?: "File";
      id: string;
      projectId: string;
      name: string;
      type: FileType;
      createdAt: string;
      updatedAt: string;
    }>;
    versions: Array<{
      __typename?: "Version";
      id: string;
      projectId: string;
      createdAt: string;
      message?: string | null;
    }>;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  } | null;
};

export type GetFileVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetFileResult = {
  __typename?: "Query";
  file?: {
    __typename?: "File";
    id: string;
    projectId: string;
    name: string;
    type: FileType;
    createdAt: string;
    updatedAt: string;
    workingFile: {
      __typename?: "WorkingFile";
      id: string;
      fileId: string;
      projectId: string;
      content: string;
      updatedAt: string;
    };
  } | null;
};

export type GetWorkingFileVariables = Exact<{
  fileId: Scalars["ID"]["input"];
}>;

export type GetWorkingFileResult = {
  __typename?: "Query";
  workingFile?: {
    __typename?: "WorkingFile";
    id: string;
    fileId: string;
    projectId: string;
    content: string;
    updatedAt: string;
  } | null;
};

export type GetVersionVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetVersionResult = {
  __typename?: "Query";
  version?: {
    __typename?: "Version";
    id: string;
    projectId: string;
    createdAt: string;
    message?: string | null;
    files: Array<{
      __typename?: "VersionFile";
      id: string;
      versionId: string;
      fileId: string;
      name: string;
      type: FileType;
      content: string;
    }>;
  } | null;
};

export type CreateProjectVariables = Exact<{
  input: NewProjectInput;
}>;

export type CreateProjectResult = {
  __typename?: "Mutation";
  createProject: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    files: Array<{
      __typename?: "File";
      id: string;
      projectId: string;
      name: string;
      type: FileType;
      createdAt: string;
      updatedAt: string;
      workingFile: {
        __typename?: "WorkingFile";
        id: string;
        fileId: string;
        projectId: string;
        content: string;
        updatedAt: string;
      };
    }>;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  };
};

export type DeleteProjectVariables = Exact<{
  projectId: Scalars["ID"]["input"];
}>;

export type DeleteProjectResult = {
  __typename?: "Mutation";
  deleteProject: boolean;
};

export type AddCollaboratorVariables = Exact<{
  projectId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
}>;

export type AddCollaboratorResult = {
  __typename?: "Mutation";
  addCollaborator: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  };
};

export type RemoveCollaboratorVariables = Exact<{
  projectId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
}>;

export type RemoveCollaboratorResult = {
  __typename?: "Mutation";
  removeCollaborator: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  };
};

export type CreateFileVariables = Exact<{
  input: NewFileInput;
}>;

export type CreateFileResult = {
  __typename?: "Mutation";
  createFile: {
    __typename?: "File";
    id: string;
    projectId: string;
    name: string;
    type: FileType;
    createdAt: string;
    updatedAt: string;
    workingFile: {
      __typename?: "WorkingFile";
      id: string;
      fileId: string;
      projectId: string;
      content: string;
      updatedAt: string;
    };
  };
};

export type RenameFileVariables = Exact<{
  fileId: Scalars["ID"]["input"];
  name: Scalars["String"]["input"];
}>;

export type RenameFileResult = {
  __typename?: "Mutation";
  renameFile: {
    __typename?: "File";
    id: string;
    projectId: string;
    name: string;
    type: FileType;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteFileVariables = Exact<{
  fileId: Scalars["ID"]["input"];
}>;

export type DeleteFileResult = { __typename?: "Mutation"; deleteFile: boolean };

export type UpdateWorkingFileVariables = Exact<{
  input: UpdateWorkingFileInput;
}>;

export type UpdateWorkingFileResult = {
  __typename?: "Mutation";
  updateWorkingFile: {
    __typename?: "WorkingFile";
    id: string;
    fileId: string;
    projectId: string;
    content: string;
    updatedAt: string;
  };
};

export type CreateVersionVariables = Exact<{
  input: CreateVersionInput;
}>;

export type CreateVersionResult = {
  __typename?: "Mutation";
  createVersion: {
    __typename?: "Version";
    id: string;
    projectId: string;
    createdAt: string;
    message?: string | null;
    files: Array<{
      __typename?: "VersionFile";
      id: string;
      versionId: string;
      fileId: string;
      name: string;
      type: FileType;
      content: string;
    }>;
  };
};

export type RestoreVersionVariables = Exact<{
  versionId: Scalars["ID"]["input"];
}>;

export type RestoreVersionResult = {
  __typename?: "Mutation";
  restoreVersion: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    files: Array<{
      __typename?: "File";
      id: string;
      projectId: string;
      name: string;
      type: FileType;
      createdAt: string;
      updatedAt: string;
      workingFile: {
        __typename?: "WorkingFile";
        id: string;
        fileId: string;
        projectId: string;
        content: string;
        updatedAt: string;
      };
    }>;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  };
};

export type WorkingFileUpdatedVariables = Exact<{
  projectId: Scalars["ID"]["input"];
}>;

export type WorkingFileUpdatedResult = {
  __typename?: "Subscription";
  workingFileUpdated: {
    __typename?: "WorkingFile";
    id: string;
    fileId: string;
    projectId: string;
    content: string;
    updatedAt: string;
  };
};

export type ProjectUpdatedVariables = Exact<{
  projectId: Scalars["ID"]["input"];
}>;

export type ProjectUpdatedResult = {
  __typename?: "Subscription";
  projectUpdated: {
    __typename?: "Project";
    id: string;
    projectName: string;
    createdAt: string;
    lastEditedAt: string;
    ownerId: string;
    collaboratorIds: Array<string>;
    rootFileId: string;
    assets: Array<{
      __typename?: "Asset";
      id: string;
      projectId: string;
      path: string;
      mimeType: string;
      size: number;
      createdAt: string;
    }>;
  };
};

export const AssetFields = gql`
  fragment AssetFields on Asset {
    id
    projectId
    path
    mimeType
    size
    createdAt
  }
`;
export const ProjectFields = gql`
  fragment ProjectFields on Project {
    id
    projectName
    createdAt
    lastEditedAt
    ownerId
    collaboratorIds
    rootFileId
    assets {
      ...AssetFields
    }
  }
  ${AssetFields}
`;
export const FileFields = gql`
  fragment FileFields on File {
    id
    projectId
    name
    type
    createdAt
    updatedAt
  }
`;
export const WorkingFileFields = gql`
  fragment WorkingFileFields on WorkingFile {
    id
    fileId
    projectId
    content
    updatedAt
  }
`;
export const FileWithContentFields = gql`
  fragment FileWithContentFields on File {
    id
    projectId
    name
    type
    createdAt
    updatedAt
    workingFile {
      ...WorkingFileFields
    }
  }
  ${WorkingFileFields}
`;
export const VersionFields = gql`
  fragment VersionFields on Version {
    id
    projectId
    createdAt
    message
  }
`;
export const VersionFileFields = gql`
  fragment VersionFileFields on VersionFile {
    id
    versionId
    fileId
    name
    type
    content
  }
`;
export const GetProjectsDocument = gql`
  query GetProjects {
    projects {
      ...ProjectFields
    }
  }
  ${ProjectFields}
`;

/**
 * __useGetProjects__
 *
 * To run a query within a React component, call `useGetProjects` and pass it any options that fit your needs.
 * When your component renders, `useGetProjects` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjects({
 *   variables: {
 *   },
 * });
 */
export function useGetProjects(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetProjectsResult,
    GetProjectsVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetProjectsResult, GetProjectsVariables>(
    GetProjectsDocument,
    options,
  );
}
export function useGetProjectsLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetProjectsResult,
    GetProjectsVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetProjectsResult, GetProjectsVariables>(
    GetProjectsDocument,
    options,
  );
}
// @ts-ignore
export function useGetProjectsSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetProjectsResult,
    GetProjectsVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetProjectsResult,
  GetProjectsVariables
>;
export function useGetProjectsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetProjectsResult,
        GetProjectsVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetProjectsResult | undefined,
  GetProjectsVariables
>;
export function useGetProjectsSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetProjectsResult,
        GetProjectsVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetProjectsResult,
    GetProjectsVariables
  >(GetProjectsDocument, options);
}
export type GetProjectsHookResult = ReturnType<typeof useGetProjects>;
export type GetProjectsLazyQueryHookResult = ReturnType<
  typeof useGetProjectsLazyQuery
>;
export type GetProjectsSuspenseQueryHookResult = ReturnType<
  typeof useGetProjectsSuspenseQuery
>;
export type GetProjectsQueryResult = Apollo.QueryResult<
  GetProjectsResult,
  GetProjectsVariables
>;
export const GetProjectDocument = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      ...ProjectFields
      files {
        ...FileWithContentFields
      }
      versions {
        ...VersionFields
      }
    }
  }
  ${ProjectFields}
  ${FileWithContentFields}
  ${VersionFields}
`;

/**
 * __useGetProject__
 *
 * To run a query within a React component, call `useGetProject` and pass it any options that fit your needs.
 * When your component renders, `useGetProject` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProject({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProject(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetProjectResult,
    GetProjectVariables
  > &
    ({ variables: GetProjectVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetProjectResult, GetProjectVariables>(
    GetProjectDocument,
    options,
  );
}
export function useGetProjectLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetProjectResult,
    GetProjectVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetProjectResult, GetProjectVariables>(
    GetProjectDocument,
    options,
  );
}
// @ts-ignore
export function useGetProjectSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetProjectResult,
    GetProjectVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetProjectResult,
  GetProjectVariables
>;
export function useGetProjectSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetProjectResult,
        GetProjectVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetProjectResult | undefined,
  GetProjectVariables
>;
export function useGetProjectSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetProjectResult,
        GetProjectVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetProjectResult,
    GetProjectVariables
  >(GetProjectDocument, options);
}
export type GetProjectHookResult = ReturnType<typeof useGetProject>;
export type GetProjectLazyQueryHookResult = ReturnType<
  typeof useGetProjectLazyQuery
>;
export type GetProjectSuspenseQueryHookResult = ReturnType<
  typeof useGetProjectSuspenseQuery
>;
export type GetProjectQueryResult = Apollo.QueryResult<
  GetProjectResult,
  GetProjectVariables
>;
export const GetProjectWithoutContentDocument = gql`
  query GetProjectWithoutContent($id: ID!) {
    project(id: $id) {
      ...ProjectFields
      files {
        ...FileFields
      }
      versions {
        ...VersionFields
      }
    }
  }
  ${ProjectFields}
  ${FileFields}
  ${VersionFields}
`;

/**
 * __useGetProjectWithoutContent__
 *
 * To run a query within a React component, call `useGetProjectWithoutContent` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectWithoutContent` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectWithoutContent({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProjectWithoutContent(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetProjectWithoutContentResult,
    GetProjectWithoutContentVariables
  > &
    (
      | { variables: GetProjectWithoutContentVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    GetProjectWithoutContentResult,
    GetProjectWithoutContentVariables
  >(GetProjectWithoutContentDocument, options);
}
export function useGetProjectWithoutContentLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetProjectWithoutContentResult,
    GetProjectWithoutContentVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetProjectWithoutContentResult,
    GetProjectWithoutContentVariables
  >(GetProjectWithoutContentDocument, options);
}
// @ts-ignore
export function useGetProjectWithoutContentSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetProjectWithoutContentResult,
    GetProjectWithoutContentVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetProjectWithoutContentResult,
  GetProjectWithoutContentVariables
>;
export function useGetProjectWithoutContentSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetProjectWithoutContentResult,
        GetProjectWithoutContentVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetProjectWithoutContentResult | undefined,
  GetProjectWithoutContentVariables
>;
export function useGetProjectWithoutContentSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetProjectWithoutContentResult,
        GetProjectWithoutContentVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetProjectWithoutContentResult,
    GetProjectWithoutContentVariables
  >(GetProjectWithoutContentDocument, options);
}
export type GetProjectWithoutContentHookResult = ReturnType<
  typeof useGetProjectWithoutContent
>;
export type GetProjectWithoutContentLazyQueryHookResult = ReturnType<
  typeof useGetProjectWithoutContentLazyQuery
>;
export type GetProjectWithoutContentSuspenseQueryHookResult = ReturnType<
  typeof useGetProjectWithoutContentSuspenseQuery
>;
export type GetProjectWithoutContentQueryResult = Apollo.QueryResult<
  GetProjectWithoutContentResult,
  GetProjectWithoutContentVariables
>;
export const GetFileDocument = gql`
  query GetFile($id: ID!) {
    file(id: $id) {
      ...FileFields
      workingFile {
        ...WorkingFileFields
      }
    }
  }
  ${FileFields}
  ${WorkingFileFields}
`;

/**
 * __useGetFile__
 *
 * To run a query within a React component, call `useGetFile` and pass it any options that fit your needs.
 * When your component renders, `useGetFile` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFile({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetFile(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetFileResult,
    GetFileVariables
  > &
    ({ variables: GetFileVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetFileResult, GetFileVariables>(
    GetFileDocument,
    options,
  );
}
export function useGetFileLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetFileResult,
    GetFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetFileResult, GetFileVariables>(
    GetFileDocument,
    options,
  );
}
// @ts-ignore
export function useGetFileSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetFileResult,
    GetFileVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<GetFileResult, GetFileVariables>;
export function useGetFileSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetFileResult,
        GetFileVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetFileResult | undefined,
  GetFileVariables
>;
export function useGetFileSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetFileResult,
        GetFileVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<GetFileResult, GetFileVariables>(
    GetFileDocument,
    options,
  );
}
export type GetFileHookResult = ReturnType<typeof useGetFile>;
export type GetFileLazyQueryHookResult = ReturnType<typeof useGetFileLazyQuery>;
export type GetFileSuspenseQueryHookResult = ReturnType<
  typeof useGetFileSuspenseQuery
>;
export type GetFileQueryResult = Apollo.QueryResult<
  GetFileResult,
  GetFileVariables
>;
export const GetWorkingFileDocument = gql`
  query GetWorkingFile($fileId: ID!) {
    workingFile(fileId: $fileId) {
      ...WorkingFileFields
    }
  }
  ${WorkingFileFields}
`;

/**
 * __useGetWorkingFile__
 *
 * To run a query within a React component, call `useGetWorkingFile` and pass it any options that fit your needs.
 * When your component renders, `useGetWorkingFile` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorkingFile({
 *   variables: {
 *      fileId: // value for 'fileId'
 *   },
 * });
 */
export function useGetWorkingFile(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetWorkingFileResult,
    GetWorkingFileVariables
  > &
    (
      | { variables: GetWorkingFileVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >(GetWorkingFileDocument, options);
}
export function useGetWorkingFileLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >(GetWorkingFileDocument, options);
}
// @ts-ignore
export function useGetWorkingFileSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetWorkingFileResult,
  GetWorkingFileVariables
>;
export function useGetWorkingFileSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetWorkingFileResult,
        GetWorkingFileVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetWorkingFileResult | undefined,
  GetWorkingFileVariables
>;
export function useGetWorkingFileSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetWorkingFileResult,
        GetWorkingFileVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >(GetWorkingFileDocument, options);
}
export type GetWorkingFileHookResult = ReturnType<typeof useGetWorkingFile>;
export type GetWorkingFileLazyQueryHookResult = ReturnType<
  typeof useGetWorkingFileLazyQuery
>;
export type GetWorkingFileSuspenseQueryHookResult = ReturnType<
  typeof useGetWorkingFileSuspenseQuery
>;
export type GetWorkingFileQueryResult = Apollo.QueryResult<
  GetWorkingFileResult,
  GetWorkingFileVariables
>;
export const GetVersionDocument = gql`
  query GetVersion($id: ID!) {
    version(id: $id) {
      ...VersionFields
      files {
        ...VersionFileFields
      }
    }
  }
  ${VersionFields}
  ${VersionFileFields}
`;

/**
 * __useGetVersion__
 *
 * To run a query within a React component, call `useGetVersion` and pass it any options that fit your needs.
 * When your component renders, `useGetVersion` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVersion({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetVersion(
  baseOptions: ApolloReactHooks.QueryHookOptions<
    GetVersionResult,
    GetVersionVariables
  > &
    ({ variables: GetVersionVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useQuery<GetVersionResult, GetVersionVariables>(
    GetVersionDocument,
    options,
  );
}
export function useGetVersionLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetVersionResult,
    GetVersionVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useLazyQuery<GetVersionResult, GetVersionVariables>(
    GetVersionDocument,
    options,
  );
}
// @ts-ignore
export function useGetVersionSuspenseQuery(
  baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<
    GetVersionResult,
    GetVersionVariables
  >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetVersionResult,
  GetVersionVariables
>;
export function useGetVersionSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetVersionResult,
        GetVersionVariables
      >,
): ApolloReactHooks.UseSuspenseQueryResult<
  GetVersionResult | undefined,
  GetVersionVariables
>;
export function useGetVersionSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        GetVersionResult,
        GetVersionVariables
      >,
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSuspenseQuery<
    GetVersionResult,
    GetVersionVariables
  >(GetVersionDocument, options);
}
export type GetVersionHookResult = ReturnType<typeof useGetVersion>;
export type GetVersionLazyQueryHookResult = ReturnType<
  typeof useGetVersionLazyQuery
>;
export type GetVersionSuspenseQueryHookResult = ReturnType<
  typeof useGetVersionSuspenseQuery
>;
export type GetVersionQueryResult = Apollo.QueryResult<
  GetVersionResult,
  GetVersionVariables
>;
export const CreateProjectDocument = gql`
  mutation CreateProject($input: NewProjectInput!) {
    createProject(input: $input) {
      ...ProjectFields
      files {
        ...FileWithContentFields
      }
    }
  }
  ${ProjectFields}
  ${FileWithContentFields}
`;
export type CreateProjectMutationFn = Apollo.MutationFunction<
  CreateProjectResult,
  CreateProjectVariables
>;

/**
 * __useCreateProject__
 *
 * To run a mutation, you first call `useCreateProject` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProject` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProject, { data, loading, error }] = useCreateProject({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProject(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateProjectResult,
    CreateProjectVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateProjectResult,
    CreateProjectVariables
  >(CreateProjectDocument, options);
}
export type CreateProjectHookResult = ReturnType<typeof useCreateProject>;
export type CreateProjectMutationResult =
  Apollo.MutationResult<CreateProjectResult>;
export type CreateProjectMutationOptions = Apollo.BaseMutationOptions<
  CreateProjectResult,
  CreateProjectVariables
>;
export const DeleteProjectDocument = gql`
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId)
  }
`;
export type DeleteProjectMutationFn = Apollo.MutationFunction<
  DeleteProjectResult,
  DeleteProjectVariables
>;

/**
 * __useDeleteProject__
 *
 * To run a mutation, you first call `useDeleteProject` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProject` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProject, { data, loading, error }] = useDeleteProject({
 *   variables: {
 *      projectId: // value for 'projectId'
 *   },
 * });
 */
export function useDeleteProject(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteProjectResult,
    DeleteProjectVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    DeleteProjectResult,
    DeleteProjectVariables
  >(DeleteProjectDocument, options);
}
export type DeleteProjectHookResult = ReturnType<typeof useDeleteProject>;
export type DeleteProjectMutationResult =
  Apollo.MutationResult<DeleteProjectResult>;
export type DeleteProjectMutationOptions = Apollo.BaseMutationOptions<
  DeleteProjectResult,
  DeleteProjectVariables
>;
export const AddCollaboratorDocument = gql`
  mutation AddCollaborator($projectId: ID!, $userId: ID!) {
    addCollaborator(projectId: $projectId, userId: $userId) {
      ...ProjectFields
    }
  }
  ${ProjectFields}
`;
export type AddCollaboratorMutationFn = Apollo.MutationFunction<
  AddCollaboratorResult,
  AddCollaboratorVariables
>;

/**
 * __useAddCollaborator__
 *
 * To run a mutation, you first call `useAddCollaborator` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCollaborator` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCollaborator, { data, loading, error }] = useAddCollaborator({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useAddCollaborator(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    AddCollaboratorResult,
    AddCollaboratorVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    AddCollaboratorResult,
    AddCollaboratorVariables
  >(AddCollaboratorDocument, options);
}
export type AddCollaboratorHookResult = ReturnType<typeof useAddCollaborator>;
export type AddCollaboratorMutationResult =
  Apollo.MutationResult<AddCollaboratorResult>;
export type AddCollaboratorMutationOptions = Apollo.BaseMutationOptions<
  AddCollaboratorResult,
  AddCollaboratorVariables
>;
export const RemoveCollaboratorDocument = gql`
  mutation RemoveCollaborator($projectId: ID!, $userId: ID!) {
    removeCollaborator(projectId: $projectId, userId: $userId) {
      ...ProjectFields
    }
  }
  ${ProjectFields}
`;
export type RemoveCollaboratorMutationFn = Apollo.MutationFunction<
  RemoveCollaboratorResult,
  RemoveCollaboratorVariables
>;

/**
 * __useRemoveCollaborator__
 *
 * To run a mutation, you first call `useRemoveCollaborator` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveCollaborator` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeCollaborator, { data, loading, error }] = useRemoveCollaborator({
 *   variables: {
 *      projectId: // value for 'projectId'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useRemoveCollaborator(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RemoveCollaboratorResult,
    RemoveCollaboratorVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    RemoveCollaboratorResult,
    RemoveCollaboratorVariables
  >(RemoveCollaboratorDocument, options);
}
export type RemoveCollaboratorHookResult = ReturnType<
  typeof useRemoveCollaborator
>;
export type RemoveCollaboratorMutationResult =
  Apollo.MutationResult<RemoveCollaboratorResult>;
export type RemoveCollaboratorMutationOptions = Apollo.BaseMutationOptions<
  RemoveCollaboratorResult,
  RemoveCollaboratorVariables
>;
export const CreateFileDocument = gql`
  mutation CreateFile($input: NewFileInput!) {
    createFile(input: $input) {
      ...FileFields
      workingFile {
        ...WorkingFileFields
      }
    }
  }
  ${FileFields}
  ${WorkingFileFields}
`;
export type CreateFileMutationFn = Apollo.MutationFunction<
  CreateFileResult,
  CreateFileVariables
>;

/**
 * __useCreateFile__
 *
 * To run a mutation, you first call `useCreateFile` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateFile` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createFile, { data, loading, error }] = useCreateFile({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateFile(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateFileResult,
    CreateFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<CreateFileResult, CreateFileVariables>(
    CreateFileDocument,
    options,
  );
}
export type CreateFileHookResult = ReturnType<typeof useCreateFile>;
export type CreateFileMutationResult = Apollo.MutationResult<CreateFileResult>;
export type CreateFileMutationOptions = Apollo.BaseMutationOptions<
  CreateFileResult,
  CreateFileVariables
>;
export const RenameFileDocument = gql`
  mutation RenameFile($fileId: ID!, $name: String!) {
    renameFile(fileId: $fileId, name: $name) {
      ...FileFields
    }
  }
  ${FileFields}
`;
export type RenameFileMutationFn = Apollo.MutationFunction<
  RenameFileResult,
  RenameFileVariables
>;

/**
 * __useRenameFile__
 *
 * To run a mutation, you first call `useRenameFile` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameFile` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameFile, { data, loading, error }] = useRenameFile({
 *   variables: {
 *      fileId: // value for 'fileId'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useRenameFile(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RenameFileResult,
    RenameFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<RenameFileResult, RenameFileVariables>(
    RenameFileDocument,
    options,
  );
}
export type RenameFileHookResult = ReturnType<typeof useRenameFile>;
export type RenameFileMutationResult = Apollo.MutationResult<RenameFileResult>;
export type RenameFileMutationOptions = Apollo.BaseMutationOptions<
  RenameFileResult,
  RenameFileVariables
>;
export const DeleteFileDocument = gql`
  mutation DeleteFile($fileId: ID!) {
    deleteFile(fileId: $fileId)
  }
`;
export type DeleteFileMutationFn = Apollo.MutationFunction<
  DeleteFileResult,
  DeleteFileVariables
>;

/**
 * __useDeleteFile__
 *
 * To run a mutation, you first call `useDeleteFile` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFile` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFile, { data, loading, error }] = useDeleteFile({
 *   variables: {
 *      fileId: // value for 'fileId'
 *   },
 * });
 */
export function useDeleteFile(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    DeleteFileResult,
    DeleteFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<DeleteFileResult, DeleteFileVariables>(
    DeleteFileDocument,
    options,
  );
}
export type DeleteFileHookResult = ReturnType<typeof useDeleteFile>;
export type DeleteFileMutationResult = Apollo.MutationResult<DeleteFileResult>;
export type DeleteFileMutationOptions = Apollo.BaseMutationOptions<
  DeleteFileResult,
  DeleteFileVariables
>;
export const UpdateWorkingFileDocument = gql`
  mutation UpdateWorkingFile($input: UpdateWorkingFileInput!) {
    updateWorkingFile(input: $input) {
      ...WorkingFileFields
    }
  }
  ${WorkingFileFields}
`;
export type UpdateWorkingFileMutationFn = Apollo.MutationFunction<
  UpdateWorkingFileResult,
  UpdateWorkingFileVariables
>;

/**
 * __useUpdateWorkingFile__
 *
 * To run a mutation, you first call `useUpdateWorkingFile` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateWorkingFile` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateWorkingFile, { data, loading, error }] = useUpdateWorkingFile({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateWorkingFile(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    UpdateWorkingFileResult,
    UpdateWorkingFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    UpdateWorkingFileResult,
    UpdateWorkingFileVariables
  >(UpdateWorkingFileDocument, options);
}
export type UpdateWorkingFileHookResult = ReturnType<
  typeof useUpdateWorkingFile
>;
export type UpdateWorkingFileMutationResult =
  Apollo.MutationResult<UpdateWorkingFileResult>;
export type UpdateWorkingFileMutationOptions = Apollo.BaseMutationOptions<
  UpdateWorkingFileResult,
  UpdateWorkingFileVariables
>;
export const CreateVersionDocument = gql`
  mutation CreateVersion($input: CreateVersionInput!) {
    createVersion(input: $input) {
      ...VersionFields
      files {
        ...VersionFileFields
      }
    }
  }
  ${VersionFields}
  ${VersionFileFields}
`;
export type CreateVersionMutationFn = Apollo.MutationFunction<
  CreateVersionResult,
  CreateVersionVariables
>;

/**
 * __useCreateVersion__
 *
 * To run a mutation, you first call `useCreateVersion` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateVersion` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createVersion, { data, loading, error }] = useCreateVersion({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateVersion(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateVersionResult,
    CreateVersionVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    CreateVersionResult,
    CreateVersionVariables
  >(CreateVersionDocument, options);
}
export type CreateVersionHookResult = ReturnType<typeof useCreateVersion>;
export type CreateVersionMutationResult =
  Apollo.MutationResult<CreateVersionResult>;
export type CreateVersionMutationOptions = Apollo.BaseMutationOptions<
  CreateVersionResult,
  CreateVersionVariables
>;
export const RestoreVersionDocument = gql`
  mutation RestoreVersion($versionId: ID!) {
    restoreVersion(versionId: $versionId) {
      ...ProjectFields
      files {
        ...FileWithContentFields
      }
    }
  }
  ${ProjectFields}
  ${FileWithContentFields}
`;
export type RestoreVersionMutationFn = Apollo.MutationFunction<
  RestoreVersionResult,
  RestoreVersionVariables
>;

/**
 * __useRestoreVersion__
 *
 * To run a mutation, you first call `useRestoreVersion` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRestoreVersion` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [restoreVersion, { data, loading, error }] = useRestoreVersion({
 *   variables: {
 *      versionId: // value for 'versionId'
 *   },
 * });
 */
export function useRestoreVersion(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RestoreVersionResult,
    RestoreVersionVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useMutation<
    RestoreVersionResult,
    RestoreVersionVariables
  >(RestoreVersionDocument, options);
}
export type RestoreVersionHookResult = ReturnType<typeof useRestoreVersion>;
export type RestoreVersionMutationResult =
  Apollo.MutationResult<RestoreVersionResult>;
export type RestoreVersionMutationOptions = Apollo.BaseMutationOptions<
  RestoreVersionResult,
  RestoreVersionVariables
>;
export const WorkingFileUpdatedDocument = gql`
  subscription WorkingFileUpdated($projectId: ID!) {
    workingFileUpdated(projectId: $projectId) {
      ...WorkingFileFields
    }
  }
  ${WorkingFileFields}
`;

/**
 * __useWorkingFileUpdated__
 *
 * To run a query within a React component, call `useWorkingFileUpdated` and pass it any options that fit your needs.
 * When your component renders, `useWorkingFileUpdated` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWorkingFileUpdated({
 *   variables: {
 *      projectId: // value for 'projectId'
 *   },
 * });
 */
export function useWorkingFileUpdated(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    WorkingFileUpdatedResult,
    WorkingFileUpdatedVariables
  > &
    (
      | { variables: WorkingFileUpdatedVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    WorkingFileUpdatedResult,
    WorkingFileUpdatedVariables
  >(WorkingFileUpdatedDocument, options);
}
export type WorkingFileUpdatedHookResult = ReturnType<
  typeof useWorkingFileUpdated
>;
export type WorkingFileUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<WorkingFileUpdatedResult>;
export const ProjectUpdatedDocument = gql`
  subscription ProjectUpdated($projectId: ID!) {
    projectUpdated(projectId: $projectId) {
      ...ProjectFields
    }
  }
  ${ProjectFields}
`;

/**
 * __useProjectUpdated__
 *
 * To run a query within a React component, call `useProjectUpdated` and pass it any options that fit your needs.
 * When your component renders, `useProjectUpdated` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProjectUpdated({
 *   variables: {
 *      projectId: // value for 'projectId'
 *   },
 * });
 */
export function useProjectUpdated(
  baseOptions: ApolloReactHooks.SubscriptionHookOptions<
    ProjectUpdatedResult,
    ProjectUpdatedVariables
  > &
    (
      | { variables: ProjectUpdatedVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return ApolloReactHooks.useSubscription<
    ProjectUpdatedResult,
    ProjectUpdatedVariables
  >(ProjectUpdatedDocument, options);
}
export type ProjectUpdatedHookResult = ReturnType<typeof useProjectUpdated>;
export type ProjectUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<ProjectUpdatedResult>;
