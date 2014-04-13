
# # OPTIONS
opts = {
  "compass"=> {
      configuration_file: 'config.rb',
      compile_on_start: true
    },
  "coffeescript"=> {
    # hide_success: true,
    input:  '_coffee',
    output: 'js'}}

guard 'coffeescript', opts["coffeescript"]
# guard 'sass', opts["sass"]

guard 'jekyll' do
  watch %r{.*}
  ignore %r{public}
end

guard 'livereload' do
  watch(%r{.+(html|js|css)})
end

guard :compass, opts["compass"] do
  watch(%r{_scss/.*$})
end