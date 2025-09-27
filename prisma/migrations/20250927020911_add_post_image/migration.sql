/*
  Warnings:

  - You are about to drop the column `image_url` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `posts` DROP COLUMN `image_url`;

-- CreateTable
CREATE TABLE `post_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `order` INTEGER NOT NULL,

    INDEX `post_images_post_id_idx`(`post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
