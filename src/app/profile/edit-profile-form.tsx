
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from './page';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  bio: z.string().max(240, 'Bio must be 240 characters or less.').optional(),
  skills: z.string().optional(),
  linkedinUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  twitterUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  profile: UserProfile;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onCancel: () => void;
}

export function EditProfileForm({ profile, onSubmit, onCancel }: EditProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      bio: profile.bio || '',
      skills: profile.skills?.join(', ') || '',
      linkedinUrl: profile.linkedinUrl || '',
      twitterUrl: profile.twitterUrl || '',
    },
  });

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little about yourself" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Input placeholder="e.g., React, Python, Firebase" {...field} />
              </FormControl>
              <FormDescription>
                Enter your skills, separated by commas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkedinUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Profile URL</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/your-username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="twitterUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter Profile URL</FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/your-username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Save Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}

    