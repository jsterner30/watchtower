import { FileTypeEnum, RuleFile, validDockerfile } from '../../../../types'

export interface DockerfileImageParts {
  image: string
  version: string
  tag: string
}

export default function (ruleFile: RuleFile): DockerfileImageParts | null {
  let imageParts: DockerfileImageParts | null = null
  if (validDockerfile.Check(ruleFile) && ruleFile.fileType === FileTypeEnum.DOCKERFILE) {
    const imageArray = ruleFile.image.split(':')
    const image = imageArray[0].replace(/\//g, '_') // slashes in image name will mess with file structure
    let version = '?'
    let tag = '?'

    if (imageArray[1] != null) {
      const versionArray = imageArray[1].split('-')
      version = versionArray[0]
      if (versionArray[1] != null) {
        tag = versionArray[1]
      }
    }

    imageParts = {
      image,
      tag,
      version
    }
  }
  return imageParts
}
