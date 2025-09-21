import type { SuiCodegenConfig } from '@mysten/codegen';

const config: SuiCodegenConfig = {
	output: '/home/ubuntu/projects/deepdashboard/src/deepbook_assets',
	generateSummaries: true,
	prune: true,
	packages: [
		{
			package: '@local-pkg/margin_trading',
			path: '/home/ubuntu/projects/deepbookv3/packages/margin_trading',
		},
	],
};

export default config;