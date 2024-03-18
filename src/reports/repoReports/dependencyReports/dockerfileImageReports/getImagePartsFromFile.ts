import { FileTypeEnum, RuleFile, validDockerfile } from '../../../../types'

export interface DockerfileImageParts {
  image: string
  tag: string
  version: string
}

export default function (ruleFile: RuleFile): DockerfileImageParts | null {
  let imageParts: DockerfileImageParts | null = null
  if (validDockerfile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.DOCKERFILE) {
    const imageArray = ruleFile.image.split(':')
    const image = imageArray[0].replace(/\//g, '_') // slashes in image name will mess with file structure
    let version = '?'
    let tag = '?'

    if (imageArray[1] != null) {
      tag = imageArray[1]
      const tagArray = tag.split('-')
      if (tagArray.length !== 1) {
        version = tagArray[0]
      }
      // if split did not find any '-', don't record a version.
    }

    imageParts = {
      image,
      tag,
      version
    }
  }
  return imageParts
}
