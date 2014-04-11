require "bootstrap-sass"
require "font-awesome-sass"

# # OPTIONS
opts = {
  "coffeescript"=> {
    # hide_success: true,
    input:  '_coffee',
    output: 'js'},
  "sass"=> {
    input:  '_scss',
    output: 'css'}}

guard 'coffeescript', opts["coffeescript"]
guard 'sass', opts["sass"]

guard 'jekyll' do
  watch %r{.*}
  ignore %r{public}
end

guard 'livereload' do
  watch(%r{.+(html|js|css)})
end

# guard :compass
