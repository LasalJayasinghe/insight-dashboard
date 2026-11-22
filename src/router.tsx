import { createRouter } from "@tanstack/react-router";
import { DefaultErrorComponent } from "./components/default-error";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: (props) => <DefaultErrorComponent error={props.error as Error} reset={props.reset} />,
  });

  return router;
};
