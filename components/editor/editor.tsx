import { EditorContent, useEditor } from '@tiptap/react'

const TiptapEditor = () => {
  const editor = useEditor({
    // extensions,
    // content,
  })
  const json = editor?.getJSON()


  return (
    <>
      <EditorContent editor={editor} />
      {/* Other components that depend on the editor instance */}
      {/* <MenuComponent editor={editor} /> */}
    </>
  )
}

export default TiptapEditor
