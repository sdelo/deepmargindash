import type { SuiCodegenConfig } from '@mysten/codegen';

const config: SuiCodegenConfig = {
	output: '/home/ubuntu/projects/deepdashboard/src/deepbook_assets',
	generateSummaries: false,
	prune: true,
	packages: [
		{
			package: '@local-pkg/deepbook-margin',
			path: '/home/ubuntu/projects/deepbookv3/packages/deepbook_margin',
		},
	],
};

export default config;