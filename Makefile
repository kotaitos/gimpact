.PHONY: release-patch release-minor release-major

release-patch:
	bun run preflight
	bun pm version patch
	git push origin main --follow-tags

release-minor:
	bun run preflight
	bun pm version minor
	git push origin main --follow-tags

release-major:
	bun run preflight
	bun pm version major
	git push origin main --follow-tags
