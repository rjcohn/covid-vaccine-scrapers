build:
	docker build -t covid-vaccine-scraper .

run:
	@mkdir -p out
	@chmod a+rwx out
	docker run --rm -it --security-opt seccomp=$(CURDIR)/chrome.json -v $(CURDIR)/out:/app/out covid-vaccine-scraper
