# Targets
.DEFAULT_GOAL := help

.PHONY: help
help: ## Print this help message
	@echo "List of available make commands";
	@echo "";
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}';
	@echo "";

.PHONY: serve
serve: ## Run the local dev server
	bun run serve

.PHONY: init-db-local
init-db-local: ## (Re-)Initialize the local dev database
	bun run init-db-local

.PHONY: deploy
deploy: ## Deploy the dev server
	bunx wrangler deploy --minify src/index.tsx

.PHONY: create-db-staging
create-db-staging: ## Create the dev database
	bunx wrangler d1 create jukebox-playlists

.PHONY: test-db-init
test-db-init: ## Test the dev database init file
	sqlite3 :memory: '.read dev/db.sql' || echo 'Failed to dry-run ./dev/db.sql!'

.PHONY: test-db-staging
init-db-staging: ## (Re-)Initialize the dev database
	# d1 execute --remote does not accept comments
	# though I'm not sure why the 2nd slash in the below sed command disappears
	cat dev/db.sql | sed -E 's/ ?--.*$///' | bunx wrangler d1 execute jukebox-playlists --remote --file=/dev/stdin
