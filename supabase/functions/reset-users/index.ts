import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting user reset process...')

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the credentials from request body
    const { email, password, username } = await req.json()

    if (!email || !password || !username) {
      throw new Error('Email, password, and username are required')
    }

    console.log('Deleting existing data from profiles and finance_entries...')

    // Delete all data from related tables
    // This will also help clean up any orphaned data
    const { error: deleteFinanceError } = await supabaseAdmin
      .from('finance_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteFinanceError) {
      console.error('Error deleting finance entries:', deleteFinanceError)
    }

    const { error: deleteDeletedError } = await supabaseAdmin
      .from('deleted_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteDeletedError) {
      console.error('Error deleting deleted entries:', deleteDeletedError)
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingProfile) {
      console.log(`User with email ${email} already exists. Using existing user.`)
      
      // Update the profile with the new username
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ username })
        .eq('id', existingProfile.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User already exists, updated username. All data cleared.',
          user: {
            id: existingProfile.id,
            email: existingProfile.email
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log('Creating new admin user...')

    // Create the new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    console.log(`New user created with ID: ${newUser.user.id}`)

    // Update the profile with username
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ username })
      .eq('id', newUser.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      throw profileError
    }

    console.log('User reset completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'New admin user created and all data cleared',
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in reset-users function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
