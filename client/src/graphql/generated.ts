import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
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
  | "IMAGE"
  | "OTHER"
  | "STY"
  | "TEX"
  | "%future added value";

export type Mutation = {
  __typename?: "Mutation";
  addCollaborator: Project;
  createFile: File;
  createProject: Project;
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

export type MutationCreateFileArgs = {
  input: NewFileInput;
};

export type MutationCreateProjectArgs = {
  input: NewProjectInput;
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
    }>;
    versions: Array<{
      __typename?: "Version";
      id: string;
      projectId: string;
      createdAt: string;
      message?: string | null;
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
  };
};

export const ProjectFields = gql`
  fragment ProjectFields on Project {
    id
    projectName
    createdAt
    lastEditedAt
    ownerId
    collaboratorIds
    rootFileId
  }
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
  baseOptions?: Apollo.QueryHookOptions<
    GetProjectsResult,
    GetProjectsVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetProjectsResult, GetProjectsVariables>(
    GetProjectsDocument,
    options,
  );
}
export function useGetProjectsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetProjectsResult,
    GetProjectsVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetProjectsResult, GetProjectsVariables>(
    GetProjectsDocument,
    options,
  );
}
// @ts-ignore
export function useGetProjectsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetProjectsResult,
    GetProjectsVariables
  >,
): Apollo.UseSuspenseQueryResult<GetProjectsResult, GetProjectsVariables>;
export function useGetProjectsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetProjectsResult, GetProjectsVariables>,
): Apollo.UseSuspenseQueryResult<
  GetProjectsResult | undefined,
  GetProjectsVariables
>;
export function useGetProjectsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetProjectsResult, GetProjectsVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetProjectsResult, GetProjectsVariables>(
    GetProjectsDocument,
    options,
  );
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
  baseOptions: Apollo.QueryHookOptions<GetProjectResult, GetProjectVariables> &
    ({ variables: GetProjectVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetProjectResult, GetProjectVariables>(
    GetProjectDocument,
    options,
  );
}
export function useGetProjectLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetProjectResult,
    GetProjectVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetProjectResult, GetProjectVariables>(
    GetProjectDocument,
    options,
  );
}
// @ts-ignore
export function useGetProjectSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetProjectResult,
    GetProjectVariables
  >,
): Apollo.UseSuspenseQueryResult<GetProjectResult, GetProjectVariables>;
export function useGetProjectSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetProjectResult, GetProjectVariables>,
): Apollo.UseSuspenseQueryResult<
  GetProjectResult | undefined,
  GetProjectVariables
>;
export function useGetProjectSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetProjectResult, GetProjectVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetProjectResult, GetProjectVariables>(
    GetProjectDocument,
    options,
  );
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
  baseOptions: Apollo.QueryHookOptions<GetFileResult, GetFileVariables> &
    ({ variables: GetFileVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetFileResult, GetFileVariables>(
    GetFileDocument,
    options,
  );
}
export function useGetFileLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetFileResult, GetFileVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetFileResult, GetFileVariables>(
    GetFileDocument,
    options,
  );
}
// @ts-ignore
export function useGetFileSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetFileResult,
    GetFileVariables
  >,
): Apollo.UseSuspenseQueryResult<GetFileResult, GetFileVariables>;
export function useGetFileSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetFileResult, GetFileVariables>,
): Apollo.UseSuspenseQueryResult<GetFileResult | undefined, GetFileVariables>;
export function useGetFileSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetFileResult, GetFileVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetFileResult, GetFileVariables>(
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
  baseOptions: Apollo.QueryHookOptions<
    GetWorkingFileResult,
    GetWorkingFileVariables
  > &
    (
      | { variables: GetWorkingFileVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetWorkingFileResult, GetWorkingFileVariables>(
    GetWorkingFileDocument,
    options,
  );
}
export function useGetWorkingFileLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetWorkingFileResult, GetWorkingFileVariables>(
    GetWorkingFileDocument,
    options,
  );
}
// @ts-ignore
export function useGetWorkingFileSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetWorkingFileResult,
    GetWorkingFileVariables
  >,
): Apollo.UseSuspenseQueryResult<GetWorkingFileResult, GetWorkingFileVariables>;
export function useGetWorkingFileSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetWorkingFileResult,
        GetWorkingFileVariables
      >,
): Apollo.UseSuspenseQueryResult<
  GetWorkingFileResult | undefined,
  GetWorkingFileVariables
>;
export function useGetWorkingFileSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetWorkingFileResult,
        GetWorkingFileVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetWorkingFileResult, GetWorkingFileVariables>(
    GetWorkingFileDocument,
    options,
  );
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
  baseOptions: Apollo.QueryHookOptions<GetVersionResult, GetVersionVariables> &
    ({ variables: GetVersionVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetVersionResult, GetVersionVariables>(
    GetVersionDocument,
    options,
  );
}
export function useGetVersionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetVersionResult,
    GetVersionVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetVersionResult, GetVersionVariables>(
    GetVersionDocument,
    options,
  );
}
// @ts-ignore
export function useGetVersionSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetVersionResult,
    GetVersionVariables
  >,
): Apollo.UseSuspenseQueryResult<GetVersionResult, GetVersionVariables>;
export function useGetVersionSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetVersionResult, GetVersionVariables>,
): Apollo.UseSuspenseQueryResult<
  GetVersionResult | undefined,
  GetVersionVariables
>;
export function useGetVersionSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetVersionResult, GetVersionVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetVersionResult, GetVersionVariables>(
    GetVersionDocument,
    options,
  );
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
        ...FileFields
      }
    }
  }
  ${ProjectFields}
  ${FileFields}
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
  baseOptions?: Apollo.MutationHookOptions<
    CreateProjectResult,
    CreateProjectVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateProjectResult, CreateProjectVariables>(
    CreateProjectDocument,
    options,
  );
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
  baseOptions?: Apollo.MutationHookOptions<
    DeleteProjectResult,
    DeleteProjectVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteProjectResult, DeleteProjectVariables>(
    DeleteProjectDocument,
    options,
  );
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
  baseOptions?: Apollo.MutationHookOptions<
    AddCollaboratorResult,
    AddCollaboratorVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<AddCollaboratorResult, AddCollaboratorVariables>(
    AddCollaboratorDocument,
    options,
  );
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
  baseOptions?: Apollo.MutationHookOptions<
    RemoveCollaboratorResult,
    RemoveCollaboratorVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
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
  baseOptions?: Apollo.MutationHookOptions<
    CreateFileResult,
    CreateFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateFileResult, CreateFileVariables>(
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
  baseOptions?: Apollo.MutationHookOptions<
    RenameFileResult,
    RenameFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RenameFileResult, RenameFileVariables>(
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
  baseOptions?: Apollo.MutationHookOptions<
    DeleteFileResult,
    DeleteFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteFileResult, DeleteFileVariables>(
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
  baseOptions?: Apollo.MutationHookOptions<
    UpdateWorkingFileResult,
    UpdateWorkingFileVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
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
  baseOptions?: Apollo.MutationHookOptions<
    CreateVersionResult,
    CreateVersionVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateVersionResult, CreateVersionVariables>(
    CreateVersionDocument,
    options,
  );
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
        ...FileFields
      }
    }
  }
  ${ProjectFields}
  ${FileFields}
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
  baseOptions?: Apollo.MutationHookOptions<
    RestoreVersionResult,
    RestoreVersionVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<RestoreVersionResult, RestoreVersionVariables>(
    RestoreVersionDocument,
    options,
  );
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
  baseOptions: Apollo.SubscriptionHookOptions<
    WorkingFileUpdatedResult,
    WorkingFileUpdatedVariables
  > &
    (
      | { variables: WorkingFileUpdatedVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSubscription<
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
  baseOptions: Apollo.SubscriptionHookOptions<
    ProjectUpdatedResult,
    ProjectUpdatedVariables
  > &
    (
      | { variables: ProjectUpdatedVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSubscription<ProjectUpdatedResult, ProjectUpdatedVariables>(
    ProjectUpdatedDocument,
    options,
  );
}
export type ProjectUpdatedHookResult = ReturnType<typeof useProjectUpdated>;
export type ProjectUpdatedSubscriptionResult =
  Apollo.SubscriptionResult<ProjectUpdatedResult>;
