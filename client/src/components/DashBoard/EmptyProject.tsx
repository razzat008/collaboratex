import { IconFolderCode } from "@tabler/icons-react";
import { ArrowUpRightIcon } from "lucide-react";
import { gql } from "@apollo/client";

import { useCreateProject } from "@/graphql/generated";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function EmptyDashBoard() {
  const [createProject, { loading }] = useCreateProject({
    update(cache, { data }) {
      if (!data?.createProject) return;

      cache.modify({
        fields: {
          projects(existingProjects = []) {
            const newProjectRef = cache.writeFragment({
              data: data.createProject,
              fragment: gql`
                fragment NewProject on Project {
                  id
                  projectName
                  __typename
                }
              `,
            });
            return [...existingProjects, newProjectRef];
          },
        },
      });
    },
  });

  // This handler passes default data when creating a project
  const handleCreate = async () => {
    await createProject({
      variables: {
        input: {
          projectName: "New Project", // you can replace with dynamic name from input later
        },
      },
    });
  };

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button className="bg-teal-700" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Button variant="outline">Import Project</Button>
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="#">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  );
}
