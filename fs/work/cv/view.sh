#!/bin/sh

ask_continue() {
  printf "Continue to next employment? [Y/n]: "
  read answer
  case "$answer" in
    [Nn]*) return 1 ;;
  esac
  return 0
}

echo "CV Version:"
cat /work/cv/version
cat /work/cv/updated

echo "---"

md /work/cv/title.md
md /work/cv/contact.md

imageviewer /work/cv/profile.jpg 40

md /work/cv/info.md

echo "|| Employment History ||"

skip_employment=0
for emp in /work/cv/employment/01-attest.md /work/cv/employment/05-snyk.md /work/cv/employment/10-brandwatch.md /work/cv/employment/20-rto.md /work/cv/employment/30-freelance.md /work/cv/employment/40-noonan.md; do
  if [ "$skip_employment" = "0" ]; then
    ask_continue || skip_employment=1
  fi
  if [ "$skip_employment" = "0" ]; then
    md "$emp"
  fi
done

md /work/cv/references.md
md /work/cv/other.md
md /work/cv/footer.md

md /work/cv/download.md